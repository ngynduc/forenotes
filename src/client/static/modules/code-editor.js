const SQL_KEYWORDS = /\b(SELECT|FROM|WHERE|AND|OR|NOT|IN|LIKE|IS|NULL|AS|ON|JOIN|LEFT|RIGHT|INNER|OUTER|CROSS|FULL|UNION|ALL|DISTINCT|GROUP|BY|ORDER|ASC|DESC|HAVING|LIMIT|OFFSET|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|ALTER|DROP|TABLE|INDEX|VIEW|CASE|WHEN|THEN|ELSE|END|EXISTS|BETWEEN|COUNT|SUM|AVG|MIN|MAX|CAST|COALESCE|TRUE|FALSE|WITH|RECURSIVE|OVER|PARTITION|WINDOW|ROW|ROWS|RANGE|PRECEDING|FOLLOWING|UNBOUNDED|CURRENT)\b/gi;

const SPL_KEYWORDS = /\b(search|eval|stats|where|rename|fields|table|sort|top|rare|dedup|join|append|union|inputlookup|outputlookup|lookup|transaction|timechart|chart|rex|regex|replace|fillnull|nullif|coalesce|if|case|mvindex|mvexpand|mvjoin|mvcount|mvfilter|mvsort|spath|xpath|strftime|strptime|now|relative_time|earliest|latest|head|tail|reverse|streamstats|eventstats|autoregress|contingency|correlate|diff|cluster|kmeans|anomalies|outlier|trendline|xyseries|untable|makeresults|map|foreach|return|sendemail|collect|index|metadata|rest|tstats|pivot|datamodel|from|into|by|over|span|bin|perc|usenull|useother|count|dc|distinct_count|sum|avg|min|max|range|stdev|var|values|list|first|last|earliest_time|latest_time|addtotals|eventcount|fieldsummary|sichart|si|geostats|geom|geomfilter|iptests|concurrency)\b/gi;

const KQL_KEYWORDS = /\b(search|where|summarize|extend|project|project-away|project-rename|join|union|make-series|range|render|materialize|let|evaluate|mv-expand|mv-apply|parse|parse-where|parse-kv|bag_unpack|pack|pack_all|invoke|scan|partition|top|top-nested|sort|order|take|limit|sample|sample-distinct|count|countif|dcount|dcountif|avg|avgif|sum|sumif|min|minif|max|maxif|percentile|percentiles|percentilew|percentilesw|stdev|stdevif|variance|varianceif|arg_max|arg_min|make_set|make_list|make_bag|buildschema|binary_all_and|binary_all_or|binary_all_xor|bin|bin_at|ago|now|datetime|timespan|format_datetime|format_timespan|startofday|startofweek|startofmonth|startofyear|endofday|endofweek|endofmonth|endofyear|dayofweek|dayofyear|week_of_year|format_bytes|parse_json|parse_url|parse_user_agent|tostring|todynamic|tobool|toint|tolong|toreal|todecimal|todouble|todatetime|totimespan|split|strcat|strlen|substring|trim|trim_end|trim_start|replace|replace_regex|contains|has|has_all|has_any|startswith|endswith|matches|in|between|distinct|database|table|column|externaldata|print|datatable|scalar|new|series|range|step|iff|case|toscalar|toscalar|\|)\b/gi;

const YARA_KEYWORDS = /\b(rule|meta|strings|condition|private|global|import|true|false|and|or|not|nocase|wide|ascii|xor|fullword|uint8|uint16|uint32|int8|int16|int32|uint8be|uint16be|uint32be|int8be|int16be|int32be|filesize|entrypoint|pe|elf|math|for|of|in|them|all|any|at|contains|icontains|startswith|istartswith|endswith|iendswith|iequals|matches|defined)\b/gi;

const SIGMA_KEYWORDS = /\b(title|id|status|description|references|author|date|modified|tags|logsource|detection|condition|fields|falsepositives|level|product|service|category|definition|selection|filter|timeframe|near|keywords|pattern|regex|contains|all|of|them|1|not|and|or)\b/gi;

const STRING_RE = /("[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*')/g;
const COMMENT_RE = /(--[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*|\/\/[^\n]*)/g;
const NUMBER_RE = /\b(\d+\.?\d*[eE]?[+-]?\d*)\b/g;

function tokenize(text, language) {
  if (!text) return [{ text: "", type: "plain" }];
  const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const keywords = keywordPattern(language);
  const tokens = [];
  let remaining = escaped;
  while (remaining.length > 0) {
    const commentMatch = COMMENT_RE.exec(remaining);
    const stringMatch = STRING_RE.exec(remaining);
    let next = null, nextIdx = null, kind = null;
    for (const [m, k] of [[commentMatch, "comment"], [stringMatch, "string"]]) {
      if (m && (nextIdx === null || m.index < nextIdx)) { next = m; nextIdx = m.index; kind = k; }
    }
    if (!next) break;
    if (nextIdx > 0) {
      tokens.push(...highlightKeywords(remaining.slice(0, nextIdx), keywords));
    }
    tokens.push({ text: next[0], type: kind });
    remaining = remaining.slice(nextIdx + next[0].length);
    COMMENT_RE.lastIndex = 0; STRING_RE.lastIndex = 0;
  }
  if (remaining.length > 0) {
    tokens.push(...highlightKeywords(remaining, keywords));
  }
  return tokens.length > 0 ? tokens : [{ text: escaped, type: "plain" }];
}

function keywordPattern(language) {
  switch ((language || "").toLowerCase()) {
    case "sql": case "postgresql": case "mysql": return SQL_KEYWORDS;
    case "spl": return SPL_KEYWORDS;
    case "kql": case "kusto": return KQL_KEYWORDS;
    case "yara": case "yar": return YARA_KEYWORDS;
    case "sigma": return SIGMA_KEYWORDS;
    default: return SPL_KEYWORDS;
  }
}

function highlightKeywords(text, keywords) {
  const tokens = [];
  let remaining = text;
  keywords.lastIndex = 0;
  let match;
  while ((match = keywords.exec(remaining)) !== null) {
    if (match.index > 0) {
      tokens.push(...numberTokens(remaining.slice(0, match.index)));
    }
    tokens.push({ text: match[0], type: "keyword" });
    remaining = remaining.slice(match.index + match[0].length);
    keywords.lastIndex = 0;
  }
  if (remaining.length > 0) {
    tokens.push(...numberTokens(remaining));
  }
  return tokens;
}

function numberTokens(text) {
  const tokens = [];
  let remaining = text;
  NUMBER_RE.lastIndex = 0;
  let match;
  while ((match = NUMBER_RE.exec(remaining)) !== null) {
    if (match.index > 0) {
      tokens.push({ text: remaining.slice(0, match.index), type: "plain" });
    }
    tokens.push({ text: match[0], type: "number" });
    remaining = remaining.slice(match.index + match[0].length);
    NUMBER_RE.lastIndex = 0;
  }
  if (remaining.length > 0) {
    tokens.push({ text: remaining, type: "plain" });
  }
  return tokens;
}

function tokensToHtml(tokens) {
  return tokens.map(t => {
    const cls = t.type === "plain" ? "" : ` class="tk-${t.type}"`;
    return `<span${cls}>${t.text}</span>`;
  }).join("");
}

export function initCodeEditors(container) {
  if (!container) return;
  container.querySelectorAll(".code-editor-wrapper").forEach(wrapper => {
    const textarea = wrapper.querySelector("textarea");
    const pre = wrapper.querySelector("pre");
    const code = pre?.querySelector("code");
    const gutter = wrapper.querySelector(".code-editor-gutter");
    const copyBtn = wrapper.querySelector(".code-editor-copy");
    const langLabel = wrapper.querySelector(".code-editor-lang");
    const form = textarea?.closest("form");
    const langSelect = form?.querySelector("[name='language']");
    if (!textarea || !pre || !code || !gutter) return;

    function getLanguage() {
      return langSelect ? langSelect.value : wrapper.dataset.language || "spl";
    }

    function update() {
      const language = getLanguage();
      if (langLabel) langLabel.textContent = language.toUpperCase();
      const html = tokensToHtml(tokenize(textarea.value, language));
      code.innerHTML = html + "\n";
      syncScroll(textarea, pre);
      updateLineNumbers(textarea, gutter);
    }

    function updateLineNumbers() {
      const lines = textarea.value.split("\n");
      const count = lines.length || 1;
      if (gutter.children.length !== count) {
        gutter.innerHTML = Array.from({ length: count }, (_, i) =>
          `<span>${i + 1}</span>`
        ).join("");
      }
    }

    function syncScroll() {
      pre.scrollTop = textarea.scrollTop;
      pre.scrollLeft = textarea.scrollLeft;
      gutter.scrollTop = textarea.scrollTop;
    }

    textarea.addEventListener("input", update);
    textarea.addEventListener("scroll", syncScroll);
    if (langSelect) {
      langSelect.addEventListener("change", update);
    }
    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        textarea.value = textarea.value.slice(0, start) + "  " + textarea.value.slice(end);
        textarea.selectionStart = textarea.selectionEnd = start + 2;
        update();
      }
    });

    copyBtn?.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(textarea.value);
        copyBtn.textContent = "Copied!";
        setTimeout(() => { copyBtn.textContent = "Copy"; }, 1500);
      } catch {
        textarea.select();
        document.execCommand("copy");
        copyBtn.textContent = "Copied!";
        setTimeout(() => { copyBtn.textContent = "Copy"; }, 1500);
      }
    });

    update();
  });
}
