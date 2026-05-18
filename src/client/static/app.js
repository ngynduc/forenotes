import { refreshAll } from "./modules/data.js";
import { initEvents } from "./modules/events.js";
import { renderApp } from "./modules/render/shell.js";
import { setFlash, state } from "./modules/state.js";

function boot() {
  initEvents(async () => {
    renderApp();
  });

  refreshAll()
    .then(renderApp)
    .catch((error) => {
      setFlash("error", error instanceof Error ? error.message : String(error));
      state.loading = false;
      renderApp();
    });
}

boot();
