// Generated from MITRE CTI enterprise-attack STIX data; excludes revoked and deprecated objects.
type AttackTagSeed = {
  attackId: string;
  name: string;
  type: "tactic" | "technique";
  parentAttackId?: string;
  tactic: string;
  attackVersion: string | null;
  externalUrl: string | null;
};

export const ATTACK_TAG_SEED: AttackTagSeed[] = [
  {
    attackId: "T1001",
    name: "Data Obfuscation",
    type: "technique",
    tactic: "Command and Control",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1001"
  },
  {
    attackId: "T1001.001",
    name: "Junk Data",
    type: "technique",
    parentAttackId: "T1001",
    tactic: "Command and Control",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1001/001"
  },
  {
    attackId: "T1001.002",
    name: "Steganography",
    type: "technique",
    parentAttackId: "T1001",
    tactic: "Command and Control",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1001/002"
  },
  {
    attackId: "T1001.003",
    name: "Protocol or Service Impersonation",
    type: "technique",
    parentAttackId: "T1001",
    tactic: "Command and Control",
    attackVersion: "2.1",
    externalUrl: "https://attack.mitre.org/techniques/T1001/003"
  },
  {
    attackId: "T1003",
    name: "OS Credential Dumping",
    type: "technique",
    tactic: "Credential Access",
    attackVersion: "2.2",
    externalUrl: "https://attack.mitre.org/techniques/T1003"
  },
  {
    attackId: "T1003.001",
    name: "LSASS Memory",
    type: "technique",
    parentAttackId: "T1003",
    tactic: "Credential Access",
    attackVersion: "1.5",
    externalUrl: "https://attack.mitre.org/techniques/T1003/001"
  },
  {
    attackId: "T1003.002",
    name: "Security Account Manager",
    type: "technique",
    parentAttackId: "T1003",
    tactic: "Credential Access",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1003/002"
  },
  {
    attackId: "T1003.003",
    name: "NTDS",
    type: "technique",
    parentAttackId: "T1003",
    tactic: "Credential Access",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1003/003"
  },
  {
    attackId: "T1003.004",
    name: "LSA Secrets",
    type: "technique",
    parentAttackId: "T1003",
    tactic: "Credential Access",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1003/004"
  },
  {
    attackId: "T1003.005",
    name: "Cached Domain Credentials",
    type: "technique",
    parentAttackId: "T1003",
    tactic: "Credential Access",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1003/005"
  },
  {
    attackId: "T1003.006",
    name: "DCSync",
    type: "technique",
    parentAttackId: "T1003",
    tactic: "Credential Access",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1003/006"
  },
  {
    attackId: "T1003.007",
    name: "Proc Filesystem",
    type: "technique",
    parentAttackId: "T1003",
    tactic: "Credential Access",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1003/007"
  },
  {
    attackId: "T1003.008",
    name: "/etc/passwd and /etc/shadow",
    type: "technique",
    parentAttackId: "T1003",
    tactic: "Credential Access",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1003/008"
  },
  {
    attackId: "T1005",
    name: "Data from Local System",
    type: "technique",
    tactic: "Collection",
    attackVersion: "1.8",
    externalUrl: "https://attack.mitre.org/techniques/T1005"
  },
  {
    attackId: "T1006",
    name: "Direct Volume Access",
    type: "technique",
    tactic: "Stealth",
    attackVersion: "3.0",
    externalUrl: "https://attack.mitre.org/techniques/T1006"
  },
  {
    attackId: "T1007",
    name: "System Service Discovery",
    type: "technique",
    tactic: "Discovery",
    attackVersion: "1.6",
    externalUrl: "https://attack.mitre.org/techniques/T1007"
  },
  {
    attackId: "T1008",
    name: "Fallback Channels",
    type: "technique",
    tactic: "Command and Control",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1008"
  },
  {
    attackId: "T1010",
    name: "Application Window Discovery",
    type: "technique",
    tactic: "Discovery",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1010"
  },
  {
    attackId: "T1011",
    name: "Exfiltration Over Other Network Medium",
    type: "technique",
    tactic: "Exfiltration",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1011"
  },
  {
    attackId: "T1011.001",
    name: "Exfiltration Over Bluetooth",
    type: "technique",
    parentAttackId: "T1011",
    tactic: "Exfiltration",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1011/001"
  },
  {
    attackId: "T1012",
    name: "Query Registry",
    type: "technique",
    tactic: "Discovery",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1012"
  },
  {
    attackId: "T1014",
    name: "Rootkit",
    type: "technique",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1014"
  },
  {
    attackId: "T1016",
    name: "System Network Configuration Discovery",
    type: "technique",
    tactic: "Discovery",
    attackVersion: "1.7",
    externalUrl: "https://attack.mitre.org/techniques/T1016"
  },
  {
    attackId: "T1016.001",
    name: "Internet Connection Discovery",
    type: "technique",
    parentAttackId: "T1016",
    tactic: "Discovery",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1016/001"
  },
  {
    attackId: "T1016.002",
    name: "Wi-Fi Discovery",
    type: "technique",
    parentAttackId: "T1016",
    tactic: "Discovery",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1016/002"
  },
  {
    attackId: "T1018",
    name: "Remote System Discovery",
    type: "technique",
    tactic: "Discovery",
    attackVersion: "3.6",
    externalUrl: "https://attack.mitre.org/techniques/T1018"
  },
  {
    attackId: "T1020",
    name: "Automated Exfiltration",
    type: "technique",
    tactic: "Exfiltration",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1020"
  },
  {
    attackId: "T1020.001",
    name: "Traffic Duplication",
    type: "technique",
    parentAttackId: "T1020",
    tactic: "Exfiltration",
    attackVersion: "1.4",
    externalUrl: "https://attack.mitre.org/techniques/T1020/001"
  },
  {
    attackId: "T1021",
    name: "Remote Services",
    type: "technique",
    tactic: "Lateral Movement",
    attackVersion: "1.6",
    externalUrl: "https://attack.mitre.org/techniques/T1021"
  },
  {
    attackId: "T1021.001",
    name: "Remote Desktop Protocol",
    type: "technique",
    parentAttackId: "T1021",
    tactic: "Lateral Movement",
    attackVersion: "1.4",
    externalUrl: "https://attack.mitre.org/techniques/T1021/001"
  },
  {
    attackId: "T1021.002",
    name: "SMB/Windows Admin Shares",
    type: "technique",
    parentAttackId: "T1021",
    tactic: "Lateral Movement",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1021/002"
  },
  {
    attackId: "T1021.003",
    name: "Distributed Component Object Model",
    type: "technique",
    parentAttackId: "T1021",
    tactic: "Lateral Movement",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1021/003"
  },
  {
    attackId: "T1021.004",
    name: "SSH",
    type: "technique",
    parentAttackId: "T1021",
    tactic: "Lateral Movement",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1021/004"
  },
  {
    attackId: "T1021.005",
    name: "VNC",
    type: "technique",
    parentAttackId: "T1021",
    tactic: "Lateral Movement",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1021/005"
  },
  {
    attackId: "T1021.006",
    name: "Windows Remote Management",
    type: "technique",
    parentAttackId: "T1021",
    tactic: "Lateral Movement",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1021/006"
  },
  {
    attackId: "T1021.007",
    name: "Cloud Services",
    type: "technique",
    parentAttackId: "T1021",
    tactic: "Lateral Movement",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1021/007"
  },
  {
    attackId: "T1021.008",
    name: "Direct Cloud VM Connections",
    type: "technique",
    parentAttackId: "T1021",
    tactic: "Lateral Movement",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1021/008"
  },
  {
    attackId: "T1025",
    name: "Data from Removable Media",
    type: "technique",
    tactic: "Collection",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1025"
  },
  {
    attackId: "T1027",
    name: "Obfuscated Files or Information",
    type: "technique",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1027"
  },
  {
    attackId: "T1027.001",
    name: "Binary Padding",
    type: "technique",
    parentAttackId: "T1027",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1027/001"
  },
  {
    attackId: "T1027.002",
    name: "Software Packing",
    type: "technique",
    parentAttackId: "T1027",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1027/002"
  },
  {
    attackId: "T1027.003",
    name: "Steganography",
    type: "technique",
    parentAttackId: "T1027",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1027/003"
  },
  {
    attackId: "T1027.004",
    name: "Compile After Delivery",
    type: "technique",
    parentAttackId: "T1027",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1027/004"
  },
  {
    attackId: "T1027.005",
    name: "Indicator Removal from Tools",
    type: "technique",
    parentAttackId: "T1027",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1027/005"
  },
  {
    attackId: "T1027.006",
    name: "HTML Smuggling",
    type: "technique",
    parentAttackId: "T1027",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1027/006"
  },
  {
    attackId: "T1027.007",
    name: "Dynamic API Resolution",
    type: "technique",
    parentAttackId: "T1027",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1027/007"
  },
  {
    attackId: "T1027.008",
    name: "Stripped Payloads",
    type: "technique",
    parentAttackId: "T1027",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1027/008"
  },
  {
    attackId: "T1027.009",
    name: "Embedded Payloads",
    type: "technique",
    parentAttackId: "T1027",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1027/009"
  },
  {
    attackId: "T1027.010",
    name: "Command Obfuscation",
    type: "technique",
    parentAttackId: "T1027",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1027/010"
  },
  {
    attackId: "T1027.011",
    name: "Fileless Storage",
    type: "technique",
    parentAttackId: "T1027",
    tactic: "Stealth",
    attackVersion: "3.0",
    externalUrl: "https://attack.mitre.org/techniques/T1027/011"
  },
  {
    attackId: "T1027.012",
    name: "LNK Icon Smuggling",
    type: "technique",
    parentAttackId: "T1027",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1027/012"
  },
  {
    attackId: "T1027.013",
    name: "Encrypted/Encoded File",
    type: "technique",
    parentAttackId: "T1027",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1027/013"
  },
  {
    attackId: "T1027.014",
    name: "Polymorphic Code",
    type: "technique",
    parentAttackId: "T1027",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1027/014"
  },
  {
    attackId: "T1027.015",
    name: "Compression",
    type: "technique",
    parentAttackId: "T1027",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1027/015"
  },
  {
    attackId: "T1027.016",
    name: "Junk Code Insertion",
    type: "technique",
    parentAttackId: "T1027",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1027/016"
  },
  {
    attackId: "T1027.017",
    name: "SVG Smuggling",
    type: "technique",
    parentAttackId: "T1027",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1027/017"
  },
  {
    attackId: "T1027.018",
    name: "Invisible Unicode",
    type: "technique",
    parentAttackId: "T1027",
    tactic: "Stealth",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1027/018"
  },
  {
    attackId: "T1029",
    name: "Scheduled Transfer",
    type: "technique",
    tactic: "Exfiltration",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1029"
  },
  {
    attackId: "T1030",
    name: "Data Transfer Size Limits",
    type: "technique",
    tactic: "Exfiltration",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1030"
  },
  {
    attackId: "T1033",
    name: "System Owner/User Discovery",
    type: "technique",
    tactic: "Discovery",
    attackVersion: "1.6",
    externalUrl: "https://attack.mitre.org/techniques/T1033"
  },
  {
    attackId: "T1036",
    name: "Masquerading",
    type: "technique",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1036"
  },
  {
    attackId: "T1036.001",
    name: "Invalid Code Signature",
    type: "technique",
    parentAttackId: "T1036",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1036/001"
  },
  {
    attackId: "T1036.002",
    name: "Right-to-Left Override",
    type: "technique",
    parentAttackId: "T1036",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1036/002"
  },
  {
    attackId: "T1036.003",
    name: "Rename Legitimate Utilities",
    type: "technique",
    parentAttackId: "T1036",
    tactic: "Stealth",
    attackVersion: "3.0",
    externalUrl: "https://attack.mitre.org/techniques/T1036/003"
  },
  {
    attackId: "T1036.004",
    name: "Masquerade Task or Service",
    type: "technique",
    parentAttackId: "T1036",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1036/004"
  },
  {
    attackId: "T1036.005",
    name: "Match Legitimate Resource Name or Location",
    type: "technique",
    parentAttackId: "T1036",
    tactic: "Stealth",
    attackVersion: "3.0",
    externalUrl: "https://attack.mitre.org/techniques/T1036/005"
  },
  {
    attackId: "T1036.006",
    name: "Space after Filename",
    type: "technique",
    parentAttackId: "T1036",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1036/006"
  },
  {
    attackId: "T1036.007",
    name: "Double File Extension",
    type: "technique",
    parentAttackId: "T1036",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1036/007"
  },
  {
    attackId: "T1036.008",
    name: "Masquerade File Type",
    type: "technique",
    parentAttackId: "T1036",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1036/008"
  },
  {
    attackId: "T1036.009",
    name: "Break Process Trees",
    type: "technique",
    parentAttackId: "T1036",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1036/009"
  },
  {
    attackId: "T1036.010",
    name: "Masquerade Account Name",
    type: "technique",
    parentAttackId: "T1036",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1036/010"
  },
  {
    attackId: "T1036.011",
    name: "Overwrite Process Arguments",
    type: "technique",
    parentAttackId: "T1036",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1036/011"
  },
  {
    attackId: "T1036.012",
    name: "Browser Fingerprint",
    type: "technique",
    parentAttackId: "T1036",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1036/012"
  },
  {
    attackId: "T1037",
    name: "Boot or Logon Initialization Scripts",
    type: "technique",
    tactic: "Persistence, Privilege Escalation",
    attackVersion: "2.4",
    externalUrl: "https://attack.mitre.org/techniques/T1037"
  },
  {
    attackId: "T1037.001",
    name: "Logon Script (Windows)",
    type: "technique",
    parentAttackId: "T1037",
    tactic: "Persistence, Privilege Escalation",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1037/001"
  },
  {
    attackId: "T1037.002",
    name: "Login Hook",
    type: "technique",
    parentAttackId: "T1037",
    tactic: "Persistence, Privilege Escalation",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1037/002"
  },
  {
    attackId: "T1037.003",
    name: "Network Logon Script",
    type: "technique",
    parentAttackId: "T1037",
    tactic: "Persistence, Privilege Escalation",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1037/003"
  },
  {
    attackId: "T1037.004",
    name: "RC Scripts",
    type: "technique",
    parentAttackId: "T1037",
    tactic: "Persistence, Privilege Escalation",
    attackVersion: "2.2",
    externalUrl: "https://attack.mitre.org/techniques/T1037/004"
  },
  {
    attackId: "T1037.005",
    name: "Startup Items",
    type: "technique",
    parentAttackId: "T1037",
    tactic: "Persistence, Privilege Escalation",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1037/005"
  },
  {
    attackId: "T1039",
    name: "Data from Network Shared Drive",
    type: "technique",
    tactic: "Collection",
    attackVersion: "1.5",
    externalUrl: "https://attack.mitre.org/techniques/T1039"
  },
  {
    attackId: "T1040",
    name: "Network Sniffing",
    type: "technique",
    tactic: "Credential Access, Discovery",
    attackVersion: "1.7",
    externalUrl: "https://attack.mitre.org/techniques/T1040"
  },
  {
    attackId: "T1041",
    name: "Exfiltration Over C2 Channel",
    type: "technique",
    tactic: "Exfiltration",
    attackVersion: "2.3",
    externalUrl: "https://attack.mitre.org/techniques/T1041"
  },
  {
    attackId: "T1046",
    name: "Network Service Discovery",
    type: "technique",
    tactic: "Discovery",
    attackVersion: "3.2",
    externalUrl: "https://attack.mitre.org/techniques/T1046"
  },
  {
    attackId: "T1047",
    name: "Windows Management Instrumentation",
    type: "technique",
    tactic: "Execution",
    attackVersion: "1.6",
    externalUrl: "https://attack.mitre.org/techniques/T1047"
  },
  {
    attackId: "T1048",
    name: "Exfiltration Over Alternative Protocol",
    type: "technique",
    tactic: "Exfiltration",
    attackVersion: "1.6",
    externalUrl: "https://attack.mitre.org/techniques/T1048"
  },
  {
    attackId: "T1048.001",
    name: "Exfiltration Over Symmetric Encrypted Non-C2 Protocol",
    type: "technique",
    parentAttackId: "T1048",
    tactic: "Exfiltration",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1048/001"
  },
  {
    attackId: "T1048.002",
    name: "Exfiltration Over Asymmetric Encrypted Non-C2 Protocol",
    type: "technique",
    parentAttackId: "T1048",
    tactic: "Exfiltration",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1048/002"
  },
  {
    attackId: "T1048.003",
    name: "Exfiltration Over Unencrypted Non-C2 Protocol",
    type: "technique",
    parentAttackId: "T1048",
    tactic: "Exfiltration",
    attackVersion: "2.2",
    externalUrl: "https://attack.mitre.org/techniques/T1048/003"
  },
  {
    attackId: "T1049",
    name: "System Network Connections Discovery",
    type: "technique",
    tactic: "Discovery",
    attackVersion: "2.5",
    externalUrl: "https://attack.mitre.org/techniques/T1049"
  },
  {
    attackId: "T1052",
    name: "Exfiltration Over Physical Medium",
    type: "technique",
    tactic: "Exfiltration",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1052"
  },
  {
    attackId: "T1052.001",
    name: "Exfiltration over USB",
    type: "technique",
    parentAttackId: "T1052",
    tactic: "Exfiltration",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1052/001"
  },
  {
    attackId: "T1053",
    name: "Scheduled Task/Job",
    type: "technique",
    tactic: "Execution, Persistence, Privilege Escalation",
    attackVersion: "2.5",
    externalUrl: "https://attack.mitre.org/techniques/T1053"
  },
  {
    attackId: "T1053.002",
    name: "At",
    type: "technique",
    parentAttackId: "T1053",
    tactic: "Execution, Persistence, Privilege Escalation",
    attackVersion: "2.4",
    externalUrl: "https://attack.mitre.org/techniques/T1053/002"
  },
  {
    attackId: "T1053.003",
    name: "Cron",
    type: "technique",
    parentAttackId: "T1053",
    tactic: "Execution, Persistence, Privilege Escalation",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1053/003"
  },
  {
    attackId: "T1053.005",
    name: "Scheduled Task",
    type: "technique",
    parentAttackId: "T1053",
    tactic: "Execution, Persistence, Privilege Escalation",
    attackVersion: "1.8",
    externalUrl: "https://attack.mitre.org/techniques/T1053/005"
  },
  {
    attackId: "T1053.006",
    name: "Systemd Timers",
    type: "technique",
    parentAttackId: "T1053",
    tactic: "Execution, Persistence, Privilege Escalation",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1053/006"
  },
  {
    attackId: "T1053.007",
    name: "Container Orchestration Job",
    type: "technique",
    parentAttackId: "T1053",
    tactic: "Execution, Persistence, Privilege Escalation",
    attackVersion: "1.4",
    externalUrl: "https://attack.mitre.org/techniques/T1053/007"
  },
  {
    attackId: "T1055",
    name: "Process Injection",
    type: "technique",
    tactic: "Stealth, Privilege Escalation",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1055"
  },
  {
    attackId: "T1055.001",
    name: "Dynamic-link Library Injection",
    type: "technique",
    parentAttackId: "T1055",
    tactic: "Stealth, Privilege Escalation",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1055/001"
  },
  {
    attackId: "T1055.002",
    name: "Portable Executable Injection",
    type: "technique",
    parentAttackId: "T1055",
    tactic: "Stealth, Privilege Escalation",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1055/002"
  },
  {
    attackId: "T1055.003",
    name: "Thread Execution Hijacking",
    type: "technique",
    parentAttackId: "T1055",
    tactic: "Stealth, Privilege Escalation",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1055/003"
  },
  {
    attackId: "T1055.004",
    name: "Asynchronous Procedure Call",
    type: "technique",
    parentAttackId: "T1055",
    tactic: "Stealth, Privilege Escalation",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1055/004"
  },
  {
    attackId: "T1055.005",
    name: "Thread Local Storage",
    type: "technique",
    parentAttackId: "T1055",
    tactic: "Stealth, Privilege Escalation",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1055/005"
  },
  {
    attackId: "T1055.008",
    name: "Ptrace System Calls",
    type: "technique",
    parentAttackId: "T1055",
    tactic: "Stealth, Privilege Escalation",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1055/008"
  },
  {
    attackId: "T1055.009",
    name: "Proc Memory",
    type: "technique",
    parentAttackId: "T1055",
    tactic: "Stealth, Privilege Escalation",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1055/009"
  },
  {
    attackId: "T1055.011",
    name: "Extra Window Memory Injection",
    type: "technique",
    parentAttackId: "T1055",
    tactic: "Stealth, Privilege Escalation",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1055/011"
  },
  {
    attackId: "T1055.012",
    name: "Process Hollowing",
    type: "technique",
    parentAttackId: "T1055",
    tactic: "Stealth, Privilege Escalation",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1055/012"
  },
  {
    attackId: "T1055.013",
    name: "Process Doppelgänging",
    type: "technique",
    parentAttackId: "T1055",
    tactic: "Stealth, Privilege Escalation",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1055/013"
  },
  {
    attackId: "T1055.014",
    name: "VDSO Hijacking",
    type: "technique",
    parentAttackId: "T1055",
    tactic: "Stealth, Privilege Escalation",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1055/014"
  },
  {
    attackId: "T1055.015",
    name: "ListPlanting",
    type: "technique",
    parentAttackId: "T1055",
    tactic: "Stealth, Privilege Escalation",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1055/015"
  },
  {
    attackId: "T1056",
    name: "Input Capture",
    type: "technique",
    tactic: "Collection, Credential Access",
    attackVersion: "1.4",
    externalUrl: "https://attack.mitre.org/techniques/T1056"
  },
  {
    attackId: "T1056.001",
    name: "Keylogging",
    type: "technique",
    parentAttackId: "T1056",
    tactic: "Collection, Credential Access",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1056/001"
  },
  {
    attackId: "T1056.002",
    name: "GUI Input Capture",
    type: "technique",
    parentAttackId: "T1056",
    tactic: "Collection, Credential Access",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1056/002"
  },
  {
    attackId: "T1056.003",
    name: "Web Portal Capture",
    type: "technique",
    parentAttackId: "T1056",
    tactic: "Collection, Credential Access",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1056/003"
  },
  {
    attackId: "T1056.004",
    name: "Credential API Hooking",
    type: "technique",
    parentAttackId: "T1056",
    tactic: "Collection, Credential Access",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1056/004"
  },
  {
    attackId: "T1057",
    name: "Process Discovery",
    type: "technique",
    tactic: "Discovery",
    attackVersion: "1.6",
    externalUrl: "https://attack.mitre.org/techniques/T1057"
  },
  {
    attackId: "T1059",
    name: "Command and Scripting Interpreter",
    type: "technique",
    tactic: "Execution",
    attackVersion: "2.7",
    externalUrl: "https://attack.mitre.org/techniques/T1059"
  },
  {
    attackId: "T1059.001",
    name: "PowerShell",
    type: "technique",
    parentAttackId: "T1059",
    tactic: "Execution",
    attackVersion: "1.5",
    externalUrl: "https://attack.mitre.org/techniques/T1059/001"
  },
  {
    attackId: "T1059.002",
    name: "AppleScript",
    type: "technique",
    parentAttackId: "T1059",
    tactic: "Execution",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1059/002"
  },
  {
    attackId: "T1059.003",
    name: "Windows Command Shell",
    type: "technique",
    parentAttackId: "T1059",
    tactic: "Execution",
    attackVersion: "1.5",
    externalUrl: "https://attack.mitre.org/techniques/T1059/003"
  },
  {
    attackId: "T1059.004",
    name: "Unix Shell",
    type: "technique",
    parentAttackId: "T1059",
    tactic: "Execution",
    attackVersion: "1.4",
    externalUrl: "https://attack.mitre.org/techniques/T1059/004"
  },
  {
    attackId: "T1059.005",
    name: "Visual Basic",
    type: "technique",
    parentAttackId: "T1059",
    tactic: "Execution",
    attackVersion: "1.5",
    externalUrl: "https://attack.mitre.org/techniques/T1059/005"
  },
  {
    attackId: "T1059.006",
    name: "Python",
    type: "technique",
    parentAttackId: "T1059",
    tactic: "Execution",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1059/006"
  },
  {
    attackId: "T1059.007",
    name: "JavaScript",
    type: "technique",
    parentAttackId: "T1059",
    tactic: "Execution",
    attackVersion: "2.2",
    externalUrl: "https://attack.mitre.org/techniques/T1059/007"
  },
  {
    attackId: "T1059.008",
    name: "Network Device CLI",
    type: "technique",
    parentAttackId: "T1059",
    tactic: "Execution",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1059/008"
  },
  {
    attackId: "T1059.009",
    name: "Cloud API",
    type: "technique",
    parentAttackId: "T1059",
    tactic: "Execution",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1059/009"
  },
  {
    attackId: "T1059.010",
    name: "AutoHotKey & AutoIT",
    type: "technique",
    parentAttackId: "T1059",
    tactic: "Execution",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1059/010"
  },
  {
    attackId: "T1059.011",
    name: "Lua",
    type: "technique",
    parentAttackId: "T1059",
    tactic: "Execution",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1059/011"
  },
  {
    attackId: "T1059.012",
    name: "Hypervisor CLI",
    type: "technique",
    parentAttackId: "T1059",
    tactic: "Execution",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1059/012"
  },
  {
    attackId: "T1059.013",
    name: "Container CLI/API",
    type: "technique",
    parentAttackId: "T1059",
    tactic: "Execution",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1059/013"
  },
  {
    attackId: "T1068",
    name: "Exploitation for Privilege Escalation",
    type: "technique",
    tactic: "Privilege Escalation",
    attackVersion: "1.6",
    externalUrl: "https://attack.mitre.org/techniques/T1068"
  },
  {
    attackId: "T1069",
    name: "Permission Groups Discovery",
    type: "technique",
    tactic: "Discovery",
    attackVersion: "2.6",
    externalUrl: "https://attack.mitre.org/techniques/T1069"
  },
  {
    attackId: "T1069.001",
    name: "Local Groups",
    type: "technique",
    parentAttackId: "T1069",
    tactic: "Discovery",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1069/001"
  },
  {
    attackId: "T1069.002",
    name: "Domain Groups",
    type: "technique",
    parentAttackId: "T1069",
    tactic: "Discovery",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1069/002"
  },
  {
    attackId: "T1069.003",
    name: "Cloud Groups",
    type: "technique",
    parentAttackId: "T1069",
    tactic: "Discovery",
    attackVersion: "1.5",
    externalUrl: "https://attack.mitre.org/techniques/T1069/003"
  },
  {
    attackId: "T1070",
    name: "Indicator Removal",
    type: "technique",
    tactic: "Stealth",
    attackVersion: "3.0",
    externalUrl: "https://attack.mitre.org/techniques/T1070"
  },
  {
    attackId: "T1070.003",
    name: "Clear Command History",
    type: "technique",
    parentAttackId: "T1070",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1070/003"
  },
  {
    attackId: "T1070.004",
    name: "File Deletion",
    type: "technique",
    parentAttackId: "T1070",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1070/004"
  },
  {
    attackId: "T1070.005",
    name: "Network Share Connection Removal",
    type: "technique",
    parentAttackId: "T1070",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1070/005"
  },
  {
    attackId: "T1070.006",
    name: "Timestomp",
    type: "technique",
    parentAttackId: "T1070",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1070/006"
  },
  {
    attackId: "T1070.007",
    name: "Clear Network Connection History and Configurations",
    type: "technique",
    parentAttackId: "T1070",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1070/007"
  },
  {
    attackId: "T1070.008",
    name: "Clear Mailbox Data",
    type: "technique",
    parentAttackId: "T1070",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1070/008"
  },
  {
    attackId: "T1070.009",
    name: "Clear Persistence",
    type: "technique",
    parentAttackId: "T1070",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1070/009"
  },
  {
    attackId: "T1070.010",
    name: "Relocate Malware",
    type: "technique",
    parentAttackId: "T1070",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1070/010"
  },
  {
    attackId: "T1071",
    name: "Application Layer Protocol",
    type: "technique",
    tactic: "Command and Control",
    attackVersion: "2.4",
    externalUrl: "https://attack.mitre.org/techniques/T1071"
  },
  {
    attackId: "T1071.001",
    name: "Web Protocols",
    type: "technique",
    parentAttackId: "T1071",
    tactic: "Command and Control",
    attackVersion: "1.5",
    externalUrl: "https://attack.mitre.org/techniques/T1071/001"
  },
  {
    attackId: "T1071.002",
    name: "File Transfer Protocols",
    type: "technique",
    parentAttackId: "T1071",
    tactic: "Command and Control",
    attackVersion: "1.4",
    externalUrl: "https://attack.mitre.org/techniques/T1071/002"
  },
  {
    attackId: "T1071.003",
    name: "Mail Protocols",
    type: "technique",
    parentAttackId: "T1071",
    tactic: "Command and Control",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1071/003"
  },
  {
    attackId: "T1071.004",
    name: "DNS",
    type: "technique",
    parentAttackId: "T1071",
    tactic: "Command and Control",
    attackVersion: "1.4",
    externalUrl: "https://attack.mitre.org/techniques/T1071/004"
  },
  {
    attackId: "T1071.005",
    name: "Publish/Subscribe Protocols",
    type: "technique",
    parentAttackId: "T1071",
    tactic: "Command and Control",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1071/005"
  },
  {
    attackId: "T1072",
    name: "Software Deployment Tools",
    type: "technique",
    tactic: "Execution, Lateral Movement",
    attackVersion: "3.2",
    externalUrl: "https://attack.mitre.org/techniques/T1072"
  },
  {
    attackId: "T1074",
    name: "Data Staged",
    type: "technique",
    tactic: "Collection",
    attackVersion: "1.5",
    externalUrl: "https://attack.mitre.org/techniques/T1074"
  },
  {
    attackId: "T1074.001",
    name: "Local Data Staging",
    type: "technique",
    parentAttackId: "T1074",
    tactic: "Collection",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1074/001"
  },
  {
    attackId: "T1074.002",
    name: "Remote Data Staging",
    type: "technique",
    parentAttackId: "T1074",
    tactic: "Collection",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1074/002"
  },
  {
    attackId: "T1078",
    name: "Valid Accounts",
    type: "technique",
    tactic: "Stealth, Persistence, Privilege Escalation, Initial Access",
    attackVersion: "3.0",
    externalUrl: "https://attack.mitre.org/techniques/T1078"
  },
  {
    attackId: "T1078.001",
    name: "Default Accounts",
    type: "technique",
    parentAttackId: "T1078",
    tactic: "Stealth, Persistence, Privilege Escalation, Initial Access",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1078/001"
  },
  {
    attackId: "T1078.002",
    name: "Domain Accounts",
    type: "technique",
    parentAttackId: "T1078",
    tactic: "Stealth, Persistence, Privilege Escalation, Initial Access",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1078/002"
  },
  {
    attackId: "T1078.003",
    name: "Local Accounts",
    type: "technique",
    parentAttackId: "T1078",
    tactic: "Stealth, Persistence, Privilege Escalation, Initial Access",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1078/003"
  },
  {
    attackId: "T1078.004",
    name: "Cloud Accounts",
    type: "technique",
    parentAttackId: "T1078",
    tactic: "Stealth, Persistence, Privilege Escalation, Initial Access",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1078/004"
  },
  {
    attackId: "T1080",
    name: "Taint Shared Content",
    type: "technique",
    tactic: "Lateral Movement",
    attackVersion: "1.6",
    externalUrl: "https://attack.mitre.org/techniques/T1080"
  },
  {
    attackId: "T1082",
    name: "System Information Discovery",
    type: "technique",
    tactic: "Discovery",
    attackVersion: "3.0",
    externalUrl: "https://attack.mitre.org/techniques/T1082"
  },
  {
    attackId: "T1083",
    name: "File and Directory Discovery",
    type: "technique",
    tactic: "Discovery",
    attackVersion: "1.7",
    externalUrl: "https://attack.mitre.org/techniques/T1083"
  },
  {
    attackId: "T1087",
    name: "Account Discovery",
    type: "technique",
    tactic: "Discovery",
    attackVersion: "2.6",
    externalUrl: "https://attack.mitre.org/techniques/T1087"
  },
  {
    attackId: "T1087.001",
    name: "Local Account",
    type: "technique",
    parentAttackId: "T1087",
    tactic: "Discovery",
    attackVersion: "1.5",
    externalUrl: "https://attack.mitre.org/techniques/T1087/001"
  },
  {
    attackId: "T1087.002",
    name: "Domain Account",
    type: "technique",
    parentAttackId: "T1087",
    tactic: "Discovery",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1087/002"
  },
  {
    attackId: "T1087.003",
    name: "Email Account",
    type: "technique",
    parentAttackId: "T1087",
    tactic: "Discovery",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1087/003"
  },
  {
    attackId: "T1087.004",
    name: "Cloud Account",
    type: "technique",
    parentAttackId: "T1087",
    tactic: "Discovery",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1087/004"
  },
  {
    attackId: "T1090",
    name: "Proxy",
    type: "technique",
    tactic: "Command and Control",
    attackVersion: "3.2",
    externalUrl: "https://attack.mitre.org/techniques/T1090"
  },
  {
    attackId: "T1090.001",
    name: "Internal Proxy",
    type: "technique",
    parentAttackId: "T1090",
    tactic: "Command and Control",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1090/001"
  },
  {
    attackId: "T1090.002",
    name: "External Proxy",
    type: "technique",
    parentAttackId: "T1090",
    tactic: "Command and Control",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1090/002"
  },
  {
    attackId: "T1090.003",
    name: "Multi-hop Proxy",
    type: "technique",
    parentAttackId: "T1090",
    tactic: "Command and Control",
    attackVersion: "2.4",
    externalUrl: "https://attack.mitre.org/techniques/T1090/003"
  },
  {
    attackId: "T1090.004",
    name: "Domain Fronting",
    type: "technique",
    parentAttackId: "T1090",
    tactic: "Command and Control",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1090/004"
  },
  {
    attackId: "T1091",
    name: "Replication Through Removable Media",
    type: "technique",
    tactic: "Lateral Movement, Initial Access",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1091"
  },
  {
    attackId: "T1092",
    name: "Communication Through Removable Media",
    type: "technique",
    tactic: "Command and Control",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1092"
  },
  {
    attackId: "T1095",
    name: "Non-Application Layer Protocol",
    type: "technique",
    tactic: "Command and Control",
    attackVersion: "2.4",
    externalUrl: "https://attack.mitre.org/techniques/T1095"
  },
  {
    attackId: "T1098",
    name: "Account Manipulation",
    type: "technique",
    tactic: "Persistence, Privilege Escalation",
    attackVersion: "2.8",
    externalUrl: "https://attack.mitre.org/techniques/T1098"
  },
  {
    attackId: "T1098.001",
    name: "Additional Cloud Credentials",
    type: "technique",
    parentAttackId: "T1098",
    tactic: "Persistence, Privilege Escalation",
    attackVersion: "2.8",
    externalUrl: "https://attack.mitre.org/techniques/T1098/001"
  },
  {
    attackId: "T1098.002",
    name: "Additional Email Delegate Permissions",
    type: "technique",
    parentAttackId: "T1098",
    tactic: "Persistence, Privilege Escalation",
    attackVersion: "2.2",
    externalUrl: "https://attack.mitre.org/techniques/T1098/002"
  },
  {
    attackId: "T1098.003",
    name: "Additional Cloud Roles",
    type: "technique",
    parentAttackId: "T1098",
    tactic: "Persistence, Privilege Escalation",
    attackVersion: "2.5",
    externalUrl: "https://attack.mitre.org/techniques/T1098/003"
  },
  {
    attackId: "T1098.004",
    name: "SSH Authorized Keys",
    type: "technique",
    parentAttackId: "T1098",
    tactic: "Persistence, Privilege Escalation",
    attackVersion: "1.4",
    externalUrl: "https://attack.mitre.org/techniques/T1098/004"
  },
  {
    attackId: "T1098.005",
    name: "Device Registration",
    type: "technique",
    parentAttackId: "T1098",
    tactic: "Persistence, Privilege Escalation",
    attackVersion: "1.4",
    externalUrl: "https://attack.mitre.org/techniques/T1098/005"
  },
  {
    attackId: "T1098.006",
    name: "Additional Container Cluster Roles",
    type: "technique",
    parentAttackId: "T1098",
    tactic: "Persistence, Privilege Escalation",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1098/006"
  },
  {
    attackId: "T1098.007",
    name: "Additional Local or Domain Groups",
    type: "technique",
    parentAttackId: "T1098",
    tactic: "Persistence, Privilege Escalation",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1098/007"
  },
  {
    attackId: "T1102",
    name: "Web Service",
    type: "technique",
    tactic: "Command and Control",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1102"
  },
  {
    attackId: "T1102.001",
    name: "Dead Drop Resolver",
    type: "technique",
    parentAttackId: "T1102",
    tactic: "Command and Control",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1102/001"
  },
  {
    attackId: "T1102.002",
    name: "Bidirectional Communication",
    type: "technique",
    parentAttackId: "T1102",
    tactic: "Command and Control",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1102/002"
  },
  {
    attackId: "T1102.003",
    name: "One-Way Communication",
    type: "technique",
    parentAttackId: "T1102",
    tactic: "Command and Control",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1102/003"
  },
  {
    attackId: "T1104",
    name: "Multi-Stage Channels",
    type: "technique",
    tactic: "Command and Control",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1104"
  },
  {
    attackId: "T1105",
    name: "Ingress Tool Transfer",
    type: "technique",
    tactic: "Command and Control",
    attackVersion: "2.6",
    externalUrl: "https://attack.mitre.org/techniques/T1105"
  },
  {
    attackId: "T1106",
    name: "Native API",
    type: "technique",
    tactic: "Execution",
    attackVersion: "2.3",
    externalUrl: "https://attack.mitre.org/techniques/T1106"
  },
  {
    attackId: "T1110",
    name: "Brute Force",
    type: "technique",
    tactic: "Credential Access",
    attackVersion: "2.8",
    externalUrl: "https://attack.mitre.org/techniques/T1110"
  },
  {
    attackId: "T1110.001",
    name: "Password Guessing",
    type: "technique",
    parentAttackId: "T1110",
    tactic: "Credential Access",
    attackVersion: "1.7",
    externalUrl: "https://attack.mitre.org/techniques/T1110/001"
  },
  {
    attackId: "T1110.002",
    name: "Password Cracking",
    type: "technique",
    parentAttackId: "T1110",
    tactic: "Credential Access",
    attackVersion: "1.4",
    externalUrl: "https://attack.mitre.org/techniques/T1110/002"
  },
  {
    attackId: "T1110.003",
    name: "Password Spraying",
    type: "technique",
    parentAttackId: "T1110",
    tactic: "Credential Access",
    attackVersion: "1.8",
    externalUrl: "https://attack.mitre.org/techniques/T1110/003"
  },
  {
    attackId: "T1110.004",
    name: "Credential Stuffing",
    type: "technique",
    parentAttackId: "T1110",
    tactic: "Credential Access",
    attackVersion: "1.7",
    externalUrl: "https://attack.mitre.org/techniques/T1110/004"
  },
  {
    attackId: "T1111",
    name: "Multi-Factor Authentication Interception",
    type: "technique",
    tactic: "Credential Access",
    attackVersion: "2.1",
    externalUrl: "https://attack.mitre.org/techniques/T1111"
  },
  {
    attackId: "T1112",
    name: "Modify Registry",
    type: "technique",
    tactic: "Defense Impairment, Persistence",
    attackVersion: "3.0",
    externalUrl: "https://attack.mitre.org/techniques/T1112"
  },
  {
    attackId: "T1113",
    name: "Screen Capture",
    type: "technique",
    tactic: "Collection",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1113"
  },
  {
    attackId: "T1114",
    name: "Email Collection",
    type: "technique",
    tactic: "Collection",
    attackVersion: "2.6",
    externalUrl: "https://attack.mitre.org/techniques/T1114"
  },
  {
    attackId: "T1114.001",
    name: "Local Email Collection",
    type: "technique",
    parentAttackId: "T1114",
    tactic: "Collection",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1114/001"
  },
  {
    attackId: "T1114.002",
    name: "Remote Email Collection",
    type: "technique",
    parentAttackId: "T1114",
    tactic: "Collection",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1114/002"
  },
  {
    attackId: "T1114.003",
    name: "Email Forwarding Rule",
    type: "technique",
    parentAttackId: "T1114",
    tactic: "Collection",
    attackVersion: "1.4",
    externalUrl: "https://attack.mitre.org/techniques/T1114/003"
  },
  {
    attackId: "T1115",
    name: "Clipboard Data",
    type: "technique",
    tactic: "Collection",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1115"
  },
  {
    attackId: "T1119",
    name: "Automated Collection",
    type: "technique",
    tactic: "Collection",
    attackVersion: "1.4",
    externalUrl: "https://attack.mitre.org/techniques/T1119"
  },
  {
    attackId: "T1120",
    name: "Peripheral Device Discovery",
    type: "technique",
    tactic: "Discovery",
    attackVersion: "1.4",
    externalUrl: "https://attack.mitre.org/techniques/T1120"
  },
  {
    attackId: "T1123",
    name: "Audio Capture",
    type: "technique",
    tactic: "Collection",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1123"
  },
  {
    attackId: "T1124",
    name: "System Time Discovery",
    type: "technique",
    tactic: "Discovery",
    attackVersion: "1.5",
    externalUrl: "https://attack.mitre.org/techniques/T1124"
  },
  {
    attackId: "T1125",
    name: "Video Capture",
    type: "technique",
    tactic: "Collection",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1125"
  },
  {
    attackId: "T1127",
    name: "Trusted Developer Utilities Proxy Execution",
    type: "technique",
    tactic: "Stealth, Execution",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1127"
  },
  {
    attackId: "T1127.001",
    name: "MSBuild",
    type: "technique",
    parentAttackId: "T1127",
    tactic: "Stealth, Execution",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1127/001"
  },
  {
    attackId: "T1127.002",
    name: "ClickOnce",
    type: "technique",
    parentAttackId: "T1127",
    tactic: "Stealth, Execution",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1127/002"
  },
  {
    attackId: "T1127.003",
    name: "JamPlus",
    type: "technique",
    parentAttackId: "T1127",
    tactic: "Stealth, Execution",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1127/003"
  },
  {
    attackId: "T1129",
    name: "Shared Modules",
    type: "technique",
    tactic: "Execution",
    attackVersion: "2.3",
    externalUrl: "https://attack.mitre.org/techniques/T1129"
  },
  {
    attackId: "T1132",
    name: "Data Encoding",
    type: "technique",
    tactic: "Command and Control",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1132"
  },
  {
    attackId: "T1132.001",
    name: "Standard Encoding",
    type: "technique",
    parentAttackId: "T1132",
    tactic: "Command and Control",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1132/001"
  },
  {
    attackId: "T1132.002",
    name: "Non-Standard Encoding",
    type: "technique",
    parentAttackId: "T1132",
    tactic: "Command and Control",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1132/002"
  },
  {
    attackId: "T1133",
    name: "External Remote Services",
    type: "technique",
    tactic: "Persistence, Initial Access",
    attackVersion: "2.5",
    externalUrl: "https://attack.mitre.org/techniques/T1133"
  },
  {
    attackId: "T1134",
    name: "Access Token Manipulation",
    type: "technique",
    tactic: "Stealth, Privilege Escalation",
    attackVersion: "3.0",
    externalUrl: "https://attack.mitre.org/techniques/T1134"
  },
  {
    attackId: "T1134.001",
    name: "Token Impersonation/Theft",
    type: "technique",
    parentAttackId: "T1134",
    tactic: "Stealth, Privilege Escalation",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1134/001"
  },
  {
    attackId: "T1134.002",
    name: "Create Process with Token",
    type: "technique",
    parentAttackId: "T1134",
    tactic: "Stealth, Privilege Escalation",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1134/002"
  },
  {
    attackId: "T1134.003",
    name: "Make and Impersonate Token",
    type: "technique",
    parentAttackId: "T1134",
    tactic: "Stealth, Privilege Escalation",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1134/003"
  },
  {
    attackId: "T1134.004",
    name: "Parent PID Spoofing",
    type: "technique",
    parentAttackId: "T1134",
    tactic: "Stealth, Privilege Escalation",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1134/004"
  },
  {
    attackId: "T1134.005",
    name: "SID-History Injection",
    type: "technique",
    parentAttackId: "T1134",
    tactic: "Stealth, Privilege Escalation",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1134/005"
  },
  {
    attackId: "T1135",
    name: "Network Share Discovery",
    type: "technique",
    tactic: "Discovery",
    attackVersion: "3.2",
    externalUrl: "https://attack.mitre.org/techniques/T1135"
  },
  {
    attackId: "T1136",
    name: "Create Account",
    type: "technique",
    tactic: "Persistence",
    attackVersion: "2.6",
    externalUrl: "https://attack.mitre.org/techniques/T1136"
  },
  {
    attackId: "T1136.001",
    name: "Local Account",
    type: "technique",
    parentAttackId: "T1136",
    tactic: "Persistence",
    attackVersion: "1.5",
    externalUrl: "https://attack.mitre.org/techniques/T1136/001"
  },
  {
    attackId: "T1136.002",
    name: "Domain Account",
    type: "technique",
    parentAttackId: "T1136",
    tactic: "Persistence",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1136/002"
  },
  {
    attackId: "T1136.003",
    name: "Cloud Account",
    type: "technique",
    parentAttackId: "T1136",
    tactic: "Persistence",
    attackVersion: "1.6",
    externalUrl: "https://attack.mitre.org/techniques/T1136/003"
  },
  {
    attackId: "T1137",
    name: "Office Application Startup",
    type: "technique",
    tactic: "Persistence",
    attackVersion: "1.4",
    externalUrl: "https://attack.mitre.org/techniques/T1137"
  },
  {
    attackId: "T1137.001",
    name: "Office Template Macros",
    type: "technique",
    parentAttackId: "T1137",
    tactic: "Persistence",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1137/001"
  },
  {
    attackId: "T1137.002",
    name: "Office Test",
    type: "technique",
    parentAttackId: "T1137",
    tactic: "Persistence",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1137/002"
  },
  {
    attackId: "T1137.003",
    name: "Outlook Forms",
    type: "technique",
    parentAttackId: "T1137",
    tactic: "Persistence",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1137/003"
  },
  {
    attackId: "T1137.004",
    name: "Outlook Home Page",
    type: "technique",
    parentAttackId: "T1137",
    tactic: "Persistence",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1137/004"
  },
  {
    attackId: "T1137.005",
    name: "Outlook Rules",
    type: "technique",
    parentAttackId: "T1137",
    tactic: "Persistence",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1137/005"
  },
  {
    attackId: "T1137.006",
    name: "Add-ins",
    type: "technique",
    parentAttackId: "T1137",
    tactic: "Persistence",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1137/006"
  },
  {
    attackId: "T1140",
    name: "Deobfuscate/Decode Files or Information",
    type: "technique",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1140"
  },
  {
    attackId: "T1176",
    name: "Software Extensions",
    type: "technique",
    tactic: "Persistence",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1176"
  },
  {
    attackId: "T1176.001",
    name: "Browser Extensions",
    type: "technique",
    parentAttackId: "T1176",
    tactic: "Persistence",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1176/001"
  },
  {
    attackId: "T1176.002",
    name: "IDE Extensions",
    type: "technique",
    parentAttackId: "T1176",
    tactic: "Persistence",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1176/002"
  },
  {
    attackId: "T1185",
    name: "Browser Session Hijacking",
    type: "technique",
    tactic: "Collection",
    attackVersion: "2.1",
    externalUrl: "https://attack.mitre.org/techniques/T1185"
  },
  {
    attackId: "T1187",
    name: "Forced Authentication",
    type: "technique",
    tactic: "Credential Access",
    attackVersion: "1.4",
    externalUrl: "https://attack.mitre.org/techniques/T1187"
  },
  {
    attackId: "T1189",
    name: "Drive-by Compromise",
    type: "technique",
    tactic: "Initial Access",
    attackVersion: "1.7",
    externalUrl: "https://attack.mitre.org/techniques/T1189"
  },
  {
    attackId: "T1190",
    name: "Exploit Public-Facing Application",
    type: "technique",
    tactic: "Initial Access",
    attackVersion: "2.8",
    externalUrl: "https://attack.mitre.org/techniques/T1190"
  },
  {
    attackId: "T1195",
    name: "Supply Chain Compromise",
    type: "technique",
    tactic: "Initial Access",
    attackVersion: "1.7",
    externalUrl: "https://attack.mitre.org/techniques/T1195"
  },
  {
    attackId: "T1195.001",
    name: "Compromise Software Dependencies and Development Tools",
    type: "technique",
    parentAttackId: "T1195",
    tactic: "Initial Access",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1195/001"
  },
  {
    attackId: "T1195.002",
    name: "Compromise Software Supply Chain",
    type: "technique",
    parentAttackId: "T1195",
    tactic: "Initial Access",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1195/002"
  },
  {
    attackId: "T1195.003",
    name: "Compromise Hardware Supply Chain",
    type: "technique",
    parentAttackId: "T1195",
    tactic: "Initial Access",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1195/003"
  },
  {
    attackId: "T1197",
    name: "BITS Jobs",
    type: "technique",
    tactic: "Stealth, Persistence, Execution",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1197"
  },
  {
    attackId: "T1199",
    name: "Trusted Relationship",
    type: "technique",
    tactic: "Initial Access",
    attackVersion: "2.4",
    externalUrl: "https://attack.mitre.org/techniques/T1199"
  },
  {
    attackId: "T1200",
    name: "Hardware Additions",
    type: "technique",
    tactic: "Initial Access",
    attackVersion: "1.7",
    externalUrl: "https://attack.mitre.org/techniques/T1200"
  },
  {
    attackId: "T1201",
    name: "Password Policy Discovery",
    type: "technique",
    tactic: "Discovery",
    attackVersion: "1.7",
    externalUrl: "https://attack.mitre.org/techniques/T1201"
  },
  {
    attackId: "T1202",
    name: "Indirect Command Execution",
    type: "technique",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1202"
  },
  {
    attackId: "T1203",
    name: "Exploitation for Client Execution",
    type: "technique",
    tactic: "Execution",
    attackVersion: "1.5",
    externalUrl: "https://attack.mitre.org/techniques/T1203"
  },
  {
    attackId: "T1204",
    name: "User Execution",
    type: "technique",
    tactic: "Execution",
    attackVersion: "1.8",
    externalUrl: "https://attack.mitre.org/techniques/T1204"
  },
  {
    attackId: "T1204.001",
    name: "Malicious Link",
    type: "technique",
    parentAttackId: "T1204",
    tactic: "Execution",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1204/001"
  },
  {
    attackId: "T1204.002",
    name: "Malicious File",
    type: "technique",
    parentAttackId: "T1204",
    tactic: "Execution",
    attackVersion: "1.6",
    externalUrl: "https://attack.mitre.org/techniques/T1204/002"
  },
  {
    attackId: "T1204.003",
    name: "Malicious Image",
    type: "technique",
    parentAttackId: "T1204",
    tactic: "Execution",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1204/003"
  },
  {
    attackId: "T1204.004",
    name: "Malicious Copy and Paste",
    type: "technique",
    parentAttackId: "T1204",
    tactic: "Execution",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1204/004"
  },
  {
    attackId: "T1204.005",
    name: "Malicious Library",
    type: "technique",
    parentAttackId: "T1204",
    tactic: "Execution",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1204/005"
  },
  {
    attackId: "T1205",
    name: "Traffic Signaling",
    type: "technique",
    tactic: "Stealth, Persistence, Command and Control",
    attackVersion: "3.0",
    externalUrl: "https://attack.mitre.org/techniques/T1205"
  },
  {
    attackId: "T1205.001",
    name: "Port Knocking",
    type: "technique",
    parentAttackId: "T1205",
    tactic: "Stealth, Persistence, Command and Control",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1205/001"
  },
  {
    attackId: "T1205.002",
    name: "Socket Filters",
    type: "technique",
    parentAttackId: "T1205",
    tactic: "Stealth, Persistence, Command and Control",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1205/002"
  },
  {
    attackId: "T1207",
    name: "Rogue Domain Controller",
    type: "technique",
    tactic: "Defense Impairment",
    attackVersion: "3.0",
    externalUrl: "https://attack.mitre.org/techniques/T1207"
  },
  {
    attackId: "T1210",
    name: "Exploitation of Remote Services",
    type: "technique",
    tactic: "Lateral Movement",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1210"
  },
  {
    attackId: "T1211",
    name: "Exploitation for Stealth",
    type: "technique",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1211"
  },
  {
    attackId: "T1212",
    name: "Exploitation for Credential Access",
    type: "technique",
    tactic: "Credential Access",
    attackVersion: "1.6",
    externalUrl: "https://attack.mitre.org/techniques/T1212"
  },
  {
    attackId: "T1213",
    name: "Data from Information Repositories",
    type: "technique",
    tactic: "Collection",
    attackVersion: "3.4",
    externalUrl: "https://attack.mitre.org/techniques/T1213"
  },
  {
    attackId: "T1213.001",
    name: "Confluence",
    type: "technique",
    parentAttackId: "T1213",
    tactic: "Collection",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1213/001"
  },
  {
    attackId: "T1213.002",
    name: "Sharepoint",
    type: "technique",
    parentAttackId: "T1213",
    tactic: "Collection",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1213/002"
  },
  {
    attackId: "T1213.003",
    name: "Code Repositories",
    type: "technique",
    parentAttackId: "T1213",
    tactic: "Collection",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1213/003"
  },
  {
    attackId: "T1213.004",
    name: "Customer Relationship Management Software",
    type: "technique",
    parentAttackId: "T1213",
    tactic: "Collection",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1213/004"
  },
  {
    attackId: "T1213.005",
    name: "Messaging Applications",
    type: "technique",
    parentAttackId: "T1213",
    tactic: "Collection",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1213/005"
  },
  {
    attackId: "T1213.006",
    name: "Databases",
    type: "technique",
    parentAttackId: "T1213",
    tactic: "Collection",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1213/006"
  },
  {
    attackId: "T1216",
    name: "System Script Proxy Execution",
    type: "technique",
    tactic: "Stealth",
    attackVersion: "3.0",
    externalUrl: "https://attack.mitre.org/techniques/T1216"
  },
  {
    attackId: "T1216.001",
    name: "PubPrn",
    type: "technique",
    parentAttackId: "T1216",
    tactic: "Stealth",
    attackVersion: "3.0",
    externalUrl: "https://attack.mitre.org/techniques/T1216/001"
  },
  {
    attackId: "T1216.002",
    name: "SyncAppvPublishingServer",
    type: "technique",
    parentAttackId: "T1216",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1216/002"
  },
  {
    attackId: "T1217",
    name: "Browser Information Discovery",
    type: "technique",
    tactic: "Discovery",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1217"
  },
  {
    attackId: "T1218",
    name: "System Binary Proxy Execution",
    type: "technique",
    tactic: "Stealth",
    attackVersion: "4.0",
    externalUrl: "https://attack.mitre.org/techniques/T1218"
  },
  {
    attackId: "T1218.001",
    name: "Compiled HTML File",
    type: "technique",
    parentAttackId: "T1218",
    tactic: "Stealth",
    attackVersion: "3.0",
    externalUrl: "https://attack.mitre.org/techniques/T1218/001"
  },
  {
    attackId: "T1218.002",
    name: "Control Panel",
    type: "technique",
    parentAttackId: "T1218",
    tactic: "Stealth",
    attackVersion: "3.0",
    externalUrl: "https://attack.mitre.org/techniques/T1218/002"
  },
  {
    attackId: "T1218.003",
    name: "CMSTP",
    type: "technique",
    parentAttackId: "T1218",
    tactic: "Stealth",
    attackVersion: "3.0",
    externalUrl: "https://attack.mitre.org/techniques/T1218/003"
  },
  {
    attackId: "T1218.004",
    name: "InstallUtil",
    type: "technique",
    parentAttackId: "T1218",
    tactic: "Stealth",
    attackVersion: "3.0",
    externalUrl: "https://attack.mitre.org/techniques/T1218/004"
  },
  {
    attackId: "T1218.005",
    name: "Mshta",
    type: "technique",
    parentAttackId: "T1218",
    tactic: "Stealth",
    attackVersion: "3.0",
    externalUrl: "https://attack.mitre.org/techniques/T1218/005"
  },
  {
    attackId: "T1218.007",
    name: "Msiexec",
    type: "technique",
    parentAttackId: "T1218",
    tactic: "Stealth",
    attackVersion: "3.0",
    externalUrl: "https://attack.mitre.org/techniques/T1218/007"
  },
  {
    attackId: "T1218.008",
    name: "Odbcconf",
    type: "technique",
    parentAttackId: "T1218",
    tactic: "Stealth",
    attackVersion: "3.0",
    externalUrl: "https://attack.mitre.org/techniques/T1218/008"
  },
  {
    attackId: "T1218.009",
    name: "Regsvcs/Regasm",
    type: "technique",
    parentAttackId: "T1218",
    tactic: "Stealth",
    attackVersion: "3.0",
    externalUrl: "https://attack.mitre.org/techniques/T1218/009"
  },
  {
    attackId: "T1218.010",
    name: "Regsvr32",
    type: "technique",
    parentAttackId: "T1218",
    tactic: "Stealth",
    attackVersion: "3.0",
    externalUrl: "https://attack.mitre.org/techniques/T1218/010"
  },
  {
    attackId: "T1218.011",
    name: "Rundll32",
    type: "technique",
    parentAttackId: "T1218",
    tactic: "Stealth",
    attackVersion: "3.0",
    externalUrl: "https://attack.mitre.org/techniques/T1218/011"
  },
  {
    attackId: "T1218.012",
    name: "Verclsid",
    type: "technique",
    parentAttackId: "T1218",
    tactic: "Stealth",
    attackVersion: "3.0",
    externalUrl: "https://attack.mitre.org/techniques/T1218/012"
  },
  {
    attackId: "T1218.013",
    name: "Mavinject",
    type: "technique",
    parentAttackId: "T1218",
    tactic: "Stealth",
    attackVersion: "3.0",
    externalUrl: "https://attack.mitre.org/techniques/T1218/013"
  },
  {
    attackId: "T1218.014",
    name: "MMC",
    type: "technique",
    parentAttackId: "T1218",
    tactic: "Stealth",
    attackVersion: "3.0",
    externalUrl: "https://attack.mitre.org/techniques/T1218/014"
  },
  {
    attackId: "T1218.015",
    name: "Electron Applications",
    type: "technique",
    parentAttackId: "T1218",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1218/015"
  },
  {
    attackId: "T1219",
    name: "Remote Access Tools",
    type: "technique",
    tactic: "Command and Control",
    attackVersion: "3.0",
    externalUrl: "https://attack.mitre.org/techniques/T1219"
  },
  {
    attackId: "T1219.001",
    name: "IDE Tunneling",
    type: "technique",
    parentAttackId: "T1219",
    tactic: "Command and Control",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1219/001"
  },
  {
    attackId: "T1219.002",
    name: "Remote Desktop Software",
    type: "technique",
    parentAttackId: "T1219",
    tactic: "Command and Control",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1219/002"
  },
  {
    attackId: "T1219.003",
    name: "Remote Access Hardware",
    type: "technique",
    parentAttackId: "T1219",
    tactic: "Command and Control",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1219/003"
  },
  {
    attackId: "T1220",
    name: "XSL Script Processing",
    type: "technique",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1220"
  },
  {
    attackId: "T1221",
    name: "Template Injection",
    type: "technique",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1221"
  },
  {
    attackId: "T1222",
    name: "File and Directory Permissions Modification",
    type: "technique",
    tactic: "Defense Impairment",
    attackVersion: "3.0",
    externalUrl: "https://attack.mitre.org/techniques/T1222"
  },
  {
    attackId: "T1222.001",
    name: "Windows Permissions",
    type: "technique",
    parentAttackId: "T1222",
    tactic: "Defense Impairment",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1222/001"
  },
  {
    attackId: "T1222.002",
    name: "Linux and Mac Permissions",
    type: "technique",
    parentAttackId: "T1222",
    tactic: "Defense Impairment",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1222/002"
  },
  {
    attackId: "T1480",
    name: "Execution Guardrails",
    type: "technique",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1480"
  },
  {
    attackId: "T1480.001",
    name: "Environmental Keying",
    type: "technique",
    parentAttackId: "T1480",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1480/001"
  },
  {
    attackId: "T1480.002",
    name: "Mutual Exclusion",
    type: "technique",
    parentAttackId: "T1480",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1480/002"
  },
  {
    attackId: "T1482",
    name: "Domain Trust Discovery",
    type: "technique",
    tactic: "Discovery",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1482"
  },
  {
    attackId: "T1484",
    name: "Domain or Tenant Policy Modification",
    type: "technique",
    tactic: "Defense Impairment, Privilege Escalation",
    attackVersion: "4.0",
    externalUrl: "https://attack.mitre.org/techniques/T1484"
  },
  {
    attackId: "T1484.001",
    name: "Group Policy Modification",
    type: "technique",
    parentAttackId: "T1484",
    tactic: "Defense Impairment, Privilege Escalation",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1484/001"
  },
  {
    attackId: "T1484.002",
    name: "Trust Modification",
    type: "technique",
    parentAttackId: "T1484",
    tactic: "Defense Impairment, Privilege Escalation",
    attackVersion: "3.0",
    externalUrl: "https://attack.mitre.org/techniques/T1484/002"
  },
  {
    attackId: "T1485",
    name: "Data Destruction",
    type: "technique",
    tactic: "Impact",
    attackVersion: "1.4",
    externalUrl: "https://attack.mitre.org/techniques/T1485"
  },
  {
    attackId: "T1485.001",
    name: "Lifecycle-Triggered Deletion",
    type: "technique",
    parentAttackId: "T1485",
    tactic: "Impact",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1485/001"
  },
  {
    attackId: "T1486",
    name: "Data Encrypted for Impact",
    type: "technique",
    tactic: "Impact",
    attackVersion: "1.5",
    externalUrl: "https://attack.mitre.org/techniques/T1486"
  },
  {
    attackId: "T1489",
    name: "Service Stop",
    type: "technique",
    tactic: "Impact",
    attackVersion: "1.4",
    externalUrl: "https://attack.mitre.org/techniques/T1489"
  },
  {
    attackId: "T1490",
    name: "Inhibit System Recovery",
    type: "technique",
    tactic: "Impact",
    attackVersion: "1.6",
    externalUrl: "https://attack.mitre.org/techniques/T1490"
  },
  {
    attackId: "T1491",
    name: "Defacement",
    type: "technique",
    tactic: "Impact",
    attackVersion: "1.4",
    externalUrl: "https://attack.mitre.org/techniques/T1491"
  },
  {
    attackId: "T1491.001",
    name: "Internal Defacement",
    type: "technique",
    parentAttackId: "T1491",
    tactic: "Impact",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1491/001"
  },
  {
    attackId: "T1491.002",
    name: "External Defacement",
    type: "technique",
    parentAttackId: "T1491",
    tactic: "Impact",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1491/002"
  },
  {
    attackId: "T1495",
    name: "Firmware Corruption",
    type: "technique",
    tactic: "Impact",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1495"
  },
  {
    attackId: "T1496",
    name: "Resource Hijacking",
    type: "technique",
    tactic: "Impact",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1496"
  },
  {
    attackId: "T1496.001",
    name: "Compute Hijacking",
    type: "technique",
    parentAttackId: "T1496",
    tactic: "Impact",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1496/001"
  },
  {
    attackId: "T1496.002",
    name: "Bandwidth Hijacking",
    type: "technique",
    parentAttackId: "T1496",
    tactic: "Impact",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1496/002"
  },
  {
    attackId: "T1496.003",
    name: "SMS Pumping",
    type: "technique",
    parentAttackId: "T1496",
    tactic: "Impact",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1496/003"
  },
  {
    attackId: "T1496.004",
    name: "Cloud Service Hijacking",
    type: "technique",
    parentAttackId: "T1496",
    tactic: "Impact",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1496/004"
  },
  {
    attackId: "T1497",
    name: "Virtualization/Sandbox Evasion",
    type: "technique",
    tactic: "Stealth, Discovery",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1497"
  },
  {
    attackId: "T1497.001",
    name: "System Checks",
    type: "technique",
    parentAttackId: "T1497",
    tactic: "Stealth, Discovery",
    attackVersion: "3.0",
    externalUrl: "https://attack.mitre.org/techniques/T1497/001"
  },
  {
    attackId: "T1497.002",
    name: "User Activity Based Checks",
    type: "technique",
    parentAttackId: "T1497",
    tactic: "Stealth, Discovery",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1497/002"
  },
  {
    attackId: "T1497.003",
    name: "Time Based Checks",
    type: "technique",
    parentAttackId: "T1497",
    tactic: "Stealth, Discovery",
    attackVersion: "3.0",
    externalUrl: "https://attack.mitre.org/techniques/T1497/003"
  },
  {
    attackId: "T1498",
    name: "Network Denial of Service",
    type: "technique",
    tactic: "Impact",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1498"
  },
  {
    attackId: "T1498.001",
    name: "Direct Network Flood",
    type: "technique",
    parentAttackId: "T1498",
    tactic: "Impact",
    attackVersion: "1.4",
    externalUrl: "https://attack.mitre.org/techniques/T1498/001"
  },
  {
    attackId: "T1498.002",
    name: "Reflection Amplification",
    type: "technique",
    parentAttackId: "T1498",
    tactic: "Impact",
    attackVersion: "1.4",
    externalUrl: "https://attack.mitre.org/techniques/T1498/002"
  },
  {
    attackId: "T1499",
    name: "Endpoint Denial of Service",
    type: "technique",
    tactic: "Impact",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1499"
  },
  {
    attackId: "T1499.001",
    name: "OS Exhaustion Flood",
    type: "technique",
    parentAttackId: "T1499",
    tactic: "Impact",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1499/001"
  },
  {
    attackId: "T1499.002",
    name: "Service Exhaustion Flood",
    type: "technique",
    parentAttackId: "T1499",
    tactic: "Impact",
    attackVersion: "1.4",
    externalUrl: "https://attack.mitre.org/techniques/T1499/002"
  },
  {
    attackId: "T1499.003",
    name: "Application Exhaustion Flood",
    type: "technique",
    parentAttackId: "T1499",
    tactic: "Impact",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1499/003"
  },
  {
    attackId: "T1499.004",
    name: "Application or System Exploitation",
    type: "technique",
    parentAttackId: "T1499",
    tactic: "Impact",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1499/004"
  },
  {
    attackId: "T1505",
    name: "Server Software Component",
    type: "technique",
    tactic: "Persistence",
    attackVersion: "1.5",
    externalUrl: "https://attack.mitre.org/techniques/T1505"
  },
  {
    attackId: "T1505.001",
    name: "SQL Stored Procedures",
    type: "technique",
    parentAttackId: "T1505",
    tactic: "Persistence",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1505/001"
  },
  {
    attackId: "T1505.002",
    name: "Transport Agent",
    type: "technique",
    parentAttackId: "T1505",
    tactic: "Persistence",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1505/002"
  },
  {
    attackId: "T1505.003",
    name: "Web Shell",
    type: "technique",
    parentAttackId: "T1505",
    tactic: "Persistence",
    attackVersion: "1.5",
    externalUrl: "https://attack.mitre.org/techniques/T1505/003"
  },
  {
    attackId: "T1505.004",
    name: "IIS Components",
    type: "technique",
    parentAttackId: "T1505",
    tactic: "Persistence",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1505/004"
  },
  {
    attackId: "T1505.005",
    name: "Terminal Services DLL",
    type: "technique",
    parentAttackId: "T1505",
    tactic: "Persistence",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1505/005"
  },
  {
    attackId: "T1505.006",
    name: "vSphere Installation Bundles",
    type: "technique",
    parentAttackId: "T1505",
    tactic: "Persistence",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1505/006"
  },
  {
    attackId: "T1518",
    name: "Software Discovery",
    type: "technique",
    tactic: "Discovery",
    attackVersion: "1.5",
    externalUrl: "https://attack.mitre.org/techniques/T1518"
  },
  {
    attackId: "T1518.001",
    name: "Security Software Discovery",
    type: "technique",
    parentAttackId: "T1518",
    tactic: "Discovery",
    attackVersion: "1.5",
    externalUrl: "https://attack.mitre.org/techniques/T1518/001"
  },
  {
    attackId: "T1518.002",
    name: "Backup Software Discovery",
    type: "technique",
    parentAttackId: "T1518",
    tactic: "Discovery",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1518/002"
  },
  {
    attackId: "T1525",
    name: "Implant Internal Image",
    type: "technique",
    tactic: "Persistence",
    attackVersion: "2.2",
    externalUrl: "https://attack.mitre.org/techniques/T1525"
  },
  {
    attackId: "T1526",
    name: "Cloud Service Discovery",
    type: "technique",
    tactic: "Discovery",
    attackVersion: "1.4",
    externalUrl: "https://attack.mitre.org/techniques/T1526"
  },
  {
    attackId: "T1528",
    name: "Steal Application Access Token",
    type: "technique",
    tactic: "Credential Access",
    attackVersion: "1.5",
    externalUrl: "https://attack.mitre.org/techniques/T1528"
  },
  {
    attackId: "T1529",
    name: "System Shutdown/Reboot",
    type: "technique",
    tactic: "Impact",
    attackVersion: "1.5",
    externalUrl: "https://attack.mitre.org/techniques/T1529"
  },
  {
    attackId: "T1530",
    name: "Data from Cloud Storage",
    type: "technique",
    tactic: "Collection",
    attackVersion: "2.2",
    externalUrl: "https://attack.mitre.org/techniques/T1530"
  },
  {
    attackId: "T1531",
    name: "Account Access Removal",
    type: "technique",
    tactic: "Impact",
    attackVersion: "1.5",
    externalUrl: "https://attack.mitre.org/techniques/T1531"
  },
  {
    attackId: "T1534",
    name: "Internal Spearphishing",
    type: "technique",
    tactic: "Lateral Movement",
    attackVersion: "1.4",
    externalUrl: "https://attack.mitre.org/techniques/T1534"
  },
  {
    attackId: "T1535",
    name: "Unused/Unsupported Cloud Regions",
    type: "technique",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1535"
  },
  {
    attackId: "T1537",
    name: "Transfer Data to Cloud Account",
    type: "technique",
    tactic: "Exfiltration",
    attackVersion: "1.5",
    externalUrl: "https://attack.mitre.org/techniques/T1537"
  },
  {
    attackId: "T1538",
    name: "Cloud Service Dashboard",
    type: "technique",
    tactic: "Discovery",
    attackVersion: "1.5",
    externalUrl: "https://attack.mitre.org/techniques/T1538"
  },
  {
    attackId: "T1539",
    name: "Steal Web Session Cookie",
    type: "technique",
    tactic: "Credential Access",
    attackVersion: "1.5",
    externalUrl: "https://attack.mitre.org/techniques/T1539"
  },
  {
    attackId: "T1542",
    name: "Pre-OS Boot",
    type: "technique",
    tactic: "Stealth, Persistence",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1542"
  },
  {
    attackId: "T1542.001",
    name: "System Firmware",
    type: "technique",
    parentAttackId: "T1542",
    tactic: "Stealth, Persistence",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1542/001"
  },
  {
    attackId: "T1542.002",
    name: "Component Firmware",
    type: "technique",
    parentAttackId: "T1542",
    tactic: "Stealth, Persistence",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1542/002"
  },
  {
    attackId: "T1542.003",
    name: "Bootkit",
    type: "technique",
    parentAttackId: "T1542",
    tactic: "Stealth, Persistence",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1542/003"
  },
  {
    attackId: "T1542.004",
    name: "ROMMONkit",
    type: "technique",
    parentAttackId: "T1542",
    tactic: "Stealth, Persistence",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1542/004"
  },
  {
    attackId: "T1542.005",
    name: "TFTP Boot",
    type: "technique",
    parentAttackId: "T1542",
    tactic: "Stealth, Persistence",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1542/005"
  },
  {
    attackId: "T1543",
    name: "Create or Modify System Process",
    type: "technique",
    tactic: "Persistence, Privilege Escalation",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1543"
  },
  {
    attackId: "T1543.001",
    name: "Launch Agent",
    type: "technique",
    parentAttackId: "T1543",
    tactic: "Persistence, Privilege Escalation",
    attackVersion: "1.5",
    externalUrl: "https://attack.mitre.org/techniques/T1543/001"
  },
  {
    attackId: "T1543.002",
    name: "Systemd Service",
    type: "technique",
    parentAttackId: "T1543",
    tactic: "Persistence, Privilege Escalation",
    attackVersion: "1.6",
    externalUrl: "https://attack.mitre.org/techniques/T1543/002"
  },
  {
    attackId: "T1543.003",
    name: "Windows Service",
    type: "technique",
    parentAttackId: "T1543",
    tactic: "Persistence, Privilege Escalation",
    attackVersion: "1.6",
    externalUrl: "https://attack.mitre.org/techniques/T1543/003"
  },
  {
    attackId: "T1543.004",
    name: "Launch Daemon",
    type: "technique",
    parentAttackId: "T1543",
    tactic: "Persistence, Privilege Escalation",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1543/004"
  },
  {
    attackId: "T1543.005",
    name: "Container Service",
    type: "technique",
    parentAttackId: "T1543",
    tactic: "Persistence, Privilege Escalation",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1543/005"
  },
  {
    attackId: "T1546",
    name: "Event Triggered Execution",
    type: "technique",
    tactic: "Privilege Escalation, Persistence",
    attackVersion: "1.4",
    externalUrl: "https://attack.mitre.org/techniques/T1546"
  },
  {
    attackId: "T1546.001",
    name: "Change Default File Association",
    type: "technique",
    parentAttackId: "T1546",
    tactic: "Privilege Escalation, Persistence",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1546/001"
  },
  {
    attackId: "T1546.002",
    name: "Screensaver",
    type: "technique",
    parentAttackId: "T1546",
    tactic: "Privilege Escalation, Persistence",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1546/002"
  },
  {
    attackId: "T1546.003",
    name: "Windows Management Instrumentation Event Subscription",
    type: "technique",
    parentAttackId: "T1546",
    tactic: "Privilege Escalation, Persistence",
    attackVersion: "1.5",
    externalUrl: "https://attack.mitre.org/techniques/T1546/003"
  },
  {
    attackId: "T1546.004",
    name: "Unix Shell Configuration Modification",
    type: "technique",
    parentAttackId: "T1546",
    tactic: "Privilege Escalation, Persistence",
    attackVersion: "2.2",
    externalUrl: "https://attack.mitre.org/techniques/T1546/004"
  },
  {
    attackId: "T1546.005",
    name: "Trap",
    type: "technique",
    parentAttackId: "T1546",
    tactic: "Privilege Escalation, Persistence",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1546/005"
  },
  {
    attackId: "T1546.006",
    name: "LC_LOAD_DYLIB Addition",
    type: "technique",
    parentAttackId: "T1546",
    tactic: "Privilege Escalation, Persistence",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1546/006"
  },
  {
    attackId: "T1546.007",
    name: "Netsh Helper DLL",
    type: "technique",
    parentAttackId: "T1546",
    tactic: "Privilege Escalation, Persistence",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1546/007"
  },
  {
    attackId: "T1546.008",
    name: "Accessibility Features",
    type: "technique",
    parentAttackId: "T1546",
    tactic: "Privilege Escalation, Persistence",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1546/008"
  },
  {
    attackId: "T1546.009",
    name: "AppCert DLLs",
    type: "technique",
    parentAttackId: "T1546",
    tactic: "Privilege Escalation, Persistence",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1546/009"
  },
  {
    attackId: "T1546.010",
    name: "AppInit DLLs",
    type: "technique",
    parentAttackId: "T1546",
    tactic: "Privilege Escalation, Persistence",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1546/010"
  },
  {
    attackId: "T1546.011",
    name: "Application Shimming",
    type: "technique",
    parentAttackId: "T1546",
    tactic: "Privilege Escalation, Persistence",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1546/011"
  },
  {
    attackId: "T1546.012",
    name: "Image File Execution Options Injection",
    type: "technique",
    parentAttackId: "T1546",
    tactic: "Privilege Escalation, Persistence",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1546/012"
  },
  {
    attackId: "T1546.013",
    name: "PowerShell Profile",
    type: "technique",
    parentAttackId: "T1546",
    tactic: "Privilege Escalation, Persistence",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1546/013"
  },
  {
    attackId: "T1546.014",
    name: "Emond",
    type: "technique",
    parentAttackId: "T1546",
    tactic: "Privilege Escalation, Persistence",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1546/014"
  },
  {
    attackId: "T1546.015",
    name: "Component Object Model Hijacking",
    type: "technique",
    parentAttackId: "T1546",
    tactic: "Privilege Escalation, Persistence",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1546/015"
  },
  {
    attackId: "T1546.016",
    name: "Installer Packages",
    type: "technique",
    parentAttackId: "T1546",
    tactic: "Privilege Escalation, Persistence",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1546/016"
  },
  {
    attackId: "T1546.017",
    name: "Udev Rules",
    type: "technique",
    parentAttackId: "T1546",
    tactic: "Persistence, Privilege Escalation",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1546/017"
  },
  {
    attackId: "T1546.018",
    name: "Python Startup Hooks",
    type: "technique",
    parentAttackId: "T1546",
    tactic: "Persistence, Privilege Escalation",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1546/018"
  },
  {
    attackId: "T1547",
    name: "Boot or Logon Autostart Execution",
    type: "technique",
    tactic: "Persistence, Privilege Escalation",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1547"
  },
  {
    attackId: "T1547.001",
    name: "Registry Run Keys / Startup Folder",
    type: "technique",
    parentAttackId: "T1547",
    tactic: "Persistence, Privilege Escalation",
    attackVersion: "2.1",
    externalUrl: "https://attack.mitre.org/techniques/T1547/001"
  },
  {
    attackId: "T1547.002",
    name: "Authentication Package",
    type: "technique",
    parentAttackId: "T1547",
    tactic: "Persistence, Privilege Escalation",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1547/002"
  },
  {
    attackId: "T1547.003",
    name: "Time Providers",
    type: "technique",
    parentAttackId: "T1547",
    tactic: "Persistence, Privilege Escalation",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1547/003"
  },
  {
    attackId: "T1547.004",
    name: "Winlogon Helper DLL",
    type: "technique",
    parentAttackId: "T1547",
    tactic: "Persistence, Privilege Escalation",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1547/004"
  },
  {
    attackId: "T1547.005",
    name: "Security Support Provider",
    type: "technique",
    parentAttackId: "T1547",
    tactic: "Persistence, Privilege Escalation",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1547/005"
  },
  {
    attackId: "T1547.006",
    name: "Kernel Modules and Extensions",
    type: "technique",
    parentAttackId: "T1547",
    tactic: "Persistence, Privilege Escalation",
    attackVersion: "1.4",
    externalUrl: "https://attack.mitre.org/techniques/T1547/006"
  },
  {
    attackId: "T1547.007",
    name: "Re-opened Applications",
    type: "technique",
    parentAttackId: "T1547",
    tactic: "Persistence, Privilege Escalation",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1547/007"
  },
  {
    attackId: "T1547.008",
    name: "LSASS Driver",
    type: "technique",
    parentAttackId: "T1547",
    tactic: "Persistence, Privilege Escalation",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1547/008"
  },
  {
    attackId: "T1547.009",
    name: "Shortcut Modification",
    type: "technique",
    parentAttackId: "T1547",
    tactic: "Persistence, Privilege Escalation",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1547/009"
  },
  {
    attackId: "T1547.010",
    name: "Port Monitors",
    type: "technique",
    parentAttackId: "T1547",
    tactic: "Persistence, Privilege Escalation",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1547/010"
  },
  {
    attackId: "T1547.012",
    name: "Print Processors",
    type: "technique",
    parentAttackId: "T1547",
    tactic: "Persistence, Privilege Escalation",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1547/012"
  },
  {
    attackId: "T1547.013",
    name: "XDG Autostart Entries",
    type: "technique",
    parentAttackId: "T1547",
    tactic: "Persistence, Privilege Escalation",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1547/013"
  },
  {
    attackId: "T1547.014",
    name: "Active Setup",
    type: "technique",
    parentAttackId: "T1547",
    tactic: "Persistence, Privilege Escalation",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1547/014"
  },
  {
    attackId: "T1547.015",
    name: "Login Items",
    type: "technique",
    parentAttackId: "T1547",
    tactic: "Persistence, Privilege Escalation",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1547/015"
  },
  {
    attackId: "T1548",
    name: "Abuse Elevation Control Mechanism",
    type: "technique",
    tactic: "Privilege Escalation",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1548"
  },
  {
    attackId: "T1548.001",
    name: "Setuid and Setgid",
    type: "technique",
    parentAttackId: "T1548",
    tactic: "Privilege Escalation",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1548/001"
  },
  {
    attackId: "T1548.002",
    name: "Bypass User Account Control",
    type: "technique",
    parentAttackId: "T1548",
    tactic: "Privilege Escalation",
    attackVersion: "3.0",
    externalUrl: "https://attack.mitre.org/techniques/T1548/002"
  },
  {
    attackId: "T1548.003",
    name: "Sudo and Sudo Caching",
    type: "technique",
    parentAttackId: "T1548",
    tactic: "Privilege Escalation",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1548/003"
  },
  {
    attackId: "T1548.004",
    name: "Elevated Execution with Prompt",
    type: "technique",
    parentAttackId: "T1548",
    tactic: "Privilege Escalation",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1548/004"
  },
  {
    attackId: "T1548.005",
    name: "Temporary Elevated Cloud Access",
    type: "technique",
    parentAttackId: "T1548",
    tactic: "Privilege Escalation",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1548/005"
  },
  {
    attackId: "T1548.006",
    name: "TCC Manipulation",
    type: "technique",
    parentAttackId: "T1548",
    tactic: "Privilege Escalation",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1548/006"
  },
  {
    attackId: "T1550",
    name: "Use Alternate Authentication Material",
    type: "technique",
    tactic: "Lateral Movement",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1550"
  },
  {
    attackId: "T1550.001",
    name: "Application Access Token",
    type: "technique",
    parentAttackId: "T1550",
    tactic: "Lateral Movement",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1550/001"
  },
  {
    attackId: "T1550.002",
    name: "Pass the Hash",
    type: "technique",
    parentAttackId: "T1550",
    tactic: "Lateral Movement",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1550/002"
  },
  {
    attackId: "T1550.003",
    name: "Pass the Ticket",
    type: "technique",
    parentAttackId: "T1550",
    tactic: "Lateral Movement",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1550/003"
  },
  {
    attackId: "T1550.004",
    name: "Web Session Cookie",
    type: "technique",
    parentAttackId: "T1550",
    tactic: "Lateral Movement",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1550/004"
  },
  {
    attackId: "T1552",
    name: "Unsecured Credentials",
    type: "technique",
    tactic: "Credential Access",
    attackVersion: "1.5",
    externalUrl: "https://attack.mitre.org/techniques/T1552"
  },
  {
    attackId: "T1552.001",
    name: "Credentials In Files",
    type: "technique",
    parentAttackId: "T1552",
    tactic: "Credential Access",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1552/001"
  },
  {
    attackId: "T1552.002",
    name: "Credentials in Registry",
    type: "technique",
    parentAttackId: "T1552",
    tactic: "Credential Access",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1552/002"
  },
  {
    attackId: "T1552.003",
    name: "Shell History",
    type: "technique",
    parentAttackId: "T1552",
    tactic: "Credential Access",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1552/003"
  },
  {
    attackId: "T1552.004",
    name: "Private Keys",
    type: "technique",
    parentAttackId: "T1552",
    tactic: "Credential Access",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1552/004"
  },
  {
    attackId: "T1552.005",
    name: "Cloud Instance Metadata API",
    type: "technique",
    parentAttackId: "T1552",
    tactic: "Credential Access",
    attackVersion: "1.4",
    externalUrl: "https://attack.mitre.org/techniques/T1552/005"
  },
  {
    attackId: "T1552.006",
    name: "Group Policy Preferences",
    type: "technique",
    parentAttackId: "T1552",
    tactic: "Credential Access",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1552/006"
  },
  {
    attackId: "T1552.007",
    name: "Container API",
    type: "technique",
    parentAttackId: "T1552",
    tactic: "Credential Access",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1552/007"
  },
  {
    attackId: "T1552.008",
    name: "Chat Messages",
    type: "technique",
    parentAttackId: "T1552",
    tactic: "Credential Access",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1552/008"
  },
  {
    attackId: "T1553",
    name: "Subvert Trust Controls",
    type: "technique",
    tactic: "Defense Impairment",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1553"
  },
  {
    attackId: "T1553.001",
    name: "Gatekeeper Bypass",
    type: "technique",
    parentAttackId: "T1553",
    tactic: "Defense Impairment",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1553/001"
  },
  {
    attackId: "T1553.002",
    name: "Code Signing",
    type: "technique",
    parentAttackId: "T1553",
    tactic: "Defense Impairment",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1553/002"
  },
  {
    attackId: "T1553.003",
    name: "SIP and Trust Provider Hijacking",
    type: "technique",
    parentAttackId: "T1553",
    tactic: "Defense Impairment",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1553/003"
  },
  {
    attackId: "T1553.004",
    name: "Install Root Certificate",
    type: "technique",
    parentAttackId: "T1553",
    tactic: "Defense Impairment",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1553/004"
  },
  {
    attackId: "T1553.005",
    name: "Mark-of-the-Web Bypass",
    type: "technique",
    parentAttackId: "T1553",
    tactic: "Defense Impairment",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1553/005"
  },
  {
    attackId: "T1553.006",
    name: "Code Signing Policy Modification",
    type: "technique",
    parentAttackId: "T1553",
    tactic: "Defense Impairment",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1553/006"
  },
  {
    attackId: "T1554",
    name: "Compromise Host Software Binary",
    type: "technique",
    tactic: "Persistence",
    attackVersion: "2.2",
    externalUrl: "https://attack.mitre.org/techniques/T1554"
  },
  {
    attackId: "T1555",
    name: "Credentials from Password Stores",
    type: "technique",
    tactic: "Credential Access",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1555"
  },
  {
    attackId: "T1555.001",
    name: "Keychain",
    type: "technique",
    parentAttackId: "T1555",
    tactic: "Credential Access",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1555/001"
  },
  {
    attackId: "T1555.002",
    name: "Securityd Memory",
    type: "technique",
    parentAttackId: "T1555",
    tactic: "Credential Access",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1555/002"
  },
  {
    attackId: "T1555.003",
    name: "Credentials from Web Browsers",
    type: "technique",
    parentAttackId: "T1555",
    tactic: "Credential Access",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1555/003"
  },
  {
    attackId: "T1555.004",
    name: "Windows Credential Manager",
    type: "technique",
    parentAttackId: "T1555",
    tactic: "Credential Access",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1555/004"
  },
  {
    attackId: "T1555.005",
    name: "Password Managers",
    type: "technique",
    parentAttackId: "T1555",
    tactic: "Credential Access",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1555/005"
  },
  {
    attackId: "T1555.006",
    name: "Cloud Secrets Management Stores",
    type: "technique",
    parentAttackId: "T1555",
    tactic: "Credential Access",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1555/006"
  },
  {
    attackId: "T1556",
    name: "Modify Authentication Process",
    type: "technique",
    tactic: "Defense Impairment, Persistence, Credential Access",
    attackVersion: "3.0",
    externalUrl: "https://attack.mitre.org/techniques/T1556"
  },
  {
    attackId: "T1556.001",
    name: "Domain Controller Authentication",
    type: "technique",
    parentAttackId: "T1556",
    tactic: "Defense Impairment, Persistence, Credential Access",
    attackVersion: "3.0",
    externalUrl: "https://attack.mitre.org/techniques/T1556/001"
  },
  {
    attackId: "T1556.002",
    name: "Password Filter DLL",
    type: "technique",
    parentAttackId: "T1556",
    tactic: "Defense Impairment, Persistence, Credential Access",
    attackVersion: "3.0",
    externalUrl: "https://attack.mitre.org/techniques/T1556/002"
  },
  {
    attackId: "T1556.003",
    name: "Pluggable Authentication Modules",
    type: "technique",
    parentAttackId: "T1556",
    tactic: "Defense Impairment, Persistence, Credential Access",
    attackVersion: "3.0",
    externalUrl: "https://attack.mitre.org/techniques/T1556/003"
  },
  {
    attackId: "T1556.004",
    name: "Network Device Authentication",
    type: "technique",
    parentAttackId: "T1556",
    tactic: "Defense Impairment, Persistence, Credential Access",
    attackVersion: "3.0",
    externalUrl: "https://attack.mitre.org/techniques/T1556/004"
  },
  {
    attackId: "T1556.005",
    name: "Reversible Encryption",
    type: "technique",
    parentAttackId: "T1556",
    tactic: "Defense Impairment, Persistence, Credential Access",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1556/005"
  },
  {
    attackId: "T1556.006",
    name: "Multi-Factor Authentication",
    type: "technique",
    parentAttackId: "T1556",
    tactic: "Defense Impairment, Persistence, Credential Access",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1556/006"
  },
  {
    attackId: "T1556.007",
    name: "Hybrid Identity",
    type: "technique",
    parentAttackId: "T1556",
    tactic: "Defense Impairment, Persistence, Credential Access",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1556/007"
  },
  {
    attackId: "T1556.008",
    name: "Network Provider DLL",
    type: "technique",
    parentAttackId: "T1556",
    tactic: "Defense Impairment, Persistence, Credential Access",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1556/008"
  },
  {
    attackId: "T1556.009",
    name: "Conditional Access Policies",
    type: "technique",
    parentAttackId: "T1556",
    tactic: "Defense Impairment, Persistence, Credential Access",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1556/009"
  },
  {
    attackId: "T1557",
    name: "Adversary-in-the-Middle",
    type: "technique",
    tactic: "Credential Access, Collection",
    attackVersion: "2.5",
    externalUrl: "https://attack.mitre.org/techniques/T1557"
  },
  {
    attackId: "T1557.001",
    name: "Name Resolution Poisoning and SMB Relay",
    type: "technique",
    parentAttackId: "T1557",
    tactic: "Credential Access, Collection",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1557/001"
  },
  {
    attackId: "T1557.002",
    name: "ARP Cache Poisoning",
    type: "technique",
    parentAttackId: "T1557",
    tactic: "Credential Access, Collection",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1557/002"
  },
  {
    attackId: "T1557.003",
    name: "DHCP Spoofing",
    type: "technique",
    parentAttackId: "T1557",
    tactic: "Credential Access, Collection",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1557/003"
  },
  {
    attackId: "T1557.004",
    name: "Evil Twin",
    type: "technique",
    parentAttackId: "T1557",
    tactic: "Credential Access, Collection",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1557/004"
  },
  {
    attackId: "T1558",
    name: "Steal or Forge Kerberos Tickets",
    type: "technique",
    tactic: "Credential Access",
    attackVersion: "1.7",
    externalUrl: "https://attack.mitre.org/techniques/T1558"
  },
  {
    attackId: "T1558.001",
    name: "Golden Ticket",
    type: "technique",
    parentAttackId: "T1558",
    tactic: "Credential Access",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1558/001"
  },
  {
    attackId: "T1558.002",
    name: "Silver Ticket",
    type: "technique",
    parentAttackId: "T1558",
    tactic: "Credential Access",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1558/002"
  },
  {
    attackId: "T1558.003",
    name: "Kerberoasting",
    type: "technique",
    parentAttackId: "T1558",
    tactic: "Credential Access",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1558/003"
  },
  {
    attackId: "T1558.004",
    name: "AS-REP Roasting",
    type: "technique",
    parentAttackId: "T1558",
    tactic: "Credential Access",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1558/004"
  },
  {
    attackId: "T1558.005",
    name: "Ccache Files",
    type: "technique",
    parentAttackId: "T1558",
    tactic: "Credential Access",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1558/005"
  },
  {
    attackId: "T1559",
    name: "Inter-Process Communication",
    type: "technique",
    tactic: "Execution",
    attackVersion: "1.4",
    externalUrl: "https://attack.mitre.org/techniques/T1559"
  },
  {
    attackId: "T1559.001",
    name: "Component Object Model",
    type: "technique",
    parentAttackId: "T1559",
    tactic: "Execution",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1559/001"
  },
  {
    attackId: "T1559.002",
    name: "Dynamic Data Exchange",
    type: "technique",
    parentAttackId: "T1559",
    tactic: "Execution",
    attackVersion: "1.4",
    externalUrl: "https://attack.mitre.org/techniques/T1559/002"
  },
  {
    attackId: "T1559.003",
    name: "XPC Services",
    type: "technique",
    parentAttackId: "T1559",
    tactic: "Execution",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1559/003"
  },
  {
    attackId: "T1560",
    name: "Archive Collected Data",
    type: "technique",
    tactic: "Collection",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1560"
  },
  {
    attackId: "T1560.001",
    name: "Archive via Utility",
    type: "technique",
    parentAttackId: "T1560",
    tactic: "Collection",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1560/001"
  },
  {
    attackId: "T1560.002",
    name: "Archive via Library",
    type: "technique",
    parentAttackId: "T1560",
    tactic: "Collection",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1560/002"
  },
  {
    attackId: "T1560.003",
    name: "Archive via Custom Method",
    type: "technique",
    parentAttackId: "T1560",
    tactic: "Collection",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1560/003"
  },
  {
    attackId: "T1561",
    name: "Disk Wipe",
    type: "technique",
    tactic: "Impact",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1561"
  },
  {
    attackId: "T1561.001",
    name: "Disk Content Wipe",
    type: "technique",
    parentAttackId: "T1561",
    tactic: "Impact",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1561/001"
  },
  {
    attackId: "T1561.002",
    name: "Disk Structure Wipe",
    type: "technique",
    parentAttackId: "T1561",
    tactic: "Impact",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1561/002"
  },
  {
    attackId: "T1563",
    name: "Remote Service Session Hijacking",
    type: "technique",
    tactic: "Lateral Movement",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1563"
  },
  {
    attackId: "T1563.001",
    name: "SSH Hijacking",
    type: "technique",
    parentAttackId: "T1563",
    tactic: "Lateral Movement",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1563/001"
  },
  {
    attackId: "T1563.002",
    name: "RDP Hijacking",
    type: "technique",
    parentAttackId: "T1563",
    tactic: "Lateral Movement",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1563/002"
  },
  {
    attackId: "T1564",
    name: "Hide Artifacts",
    type: "technique",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1564"
  },
  {
    attackId: "T1564.001",
    name: "Hidden Files and Directories",
    type: "technique",
    parentAttackId: "T1564",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1564/001"
  },
  {
    attackId: "T1564.002",
    name: "Hidden Users",
    type: "technique",
    parentAttackId: "T1564",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1564/002"
  },
  {
    attackId: "T1564.003",
    name: "Hidden Window",
    type: "technique",
    parentAttackId: "T1564",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1564/003"
  },
  {
    attackId: "T1564.004",
    name: "NTFS File Attributes",
    type: "technique",
    parentAttackId: "T1564",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1564/004"
  },
  {
    attackId: "T1564.005",
    name: "Hidden File System",
    type: "technique",
    parentAttackId: "T1564",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1564/005"
  },
  {
    attackId: "T1564.006",
    name: "Run Virtual Instance",
    type: "technique",
    parentAttackId: "T1564",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1564/006"
  },
  {
    attackId: "T1564.007",
    name: "VBA Stomping",
    type: "technique",
    parentAttackId: "T1564",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1564/007"
  },
  {
    attackId: "T1564.008",
    name: "Email Hiding Rules",
    type: "technique",
    parentAttackId: "T1564",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1564/008"
  },
  {
    attackId: "T1564.009",
    name: "Resource Forking",
    type: "technique",
    parentAttackId: "T1564",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1564/009"
  },
  {
    attackId: "T1564.010",
    name: "Process Argument Spoofing",
    type: "technique",
    parentAttackId: "T1564",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1564/010"
  },
  {
    attackId: "T1564.011",
    name: "Ignore Process Interrupts",
    type: "technique",
    parentAttackId: "T1564",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1564/011"
  },
  {
    attackId: "T1564.012",
    name: "File/Path Exclusions",
    type: "technique",
    parentAttackId: "T1564",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1564/012"
  },
  {
    attackId: "T1564.013",
    name: "Bind Mounts",
    type: "technique",
    parentAttackId: "T1564",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1564/013"
  },
  {
    attackId: "T1564.014",
    name: "Extended Attributes",
    type: "technique",
    parentAttackId: "T1564",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1564/014"
  },
  {
    attackId: "T1565",
    name: "Data Manipulation",
    type: "technique",
    tactic: "Impact",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1565"
  },
  {
    attackId: "T1565.001",
    name: "Stored Data Manipulation",
    type: "technique",
    parentAttackId: "T1565",
    tactic: "Impact",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1565/001"
  },
  {
    attackId: "T1565.002",
    name: "Transmitted Data Manipulation",
    type: "technique",
    parentAttackId: "T1565",
    tactic: "Impact",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1565/002"
  },
  {
    attackId: "T1565.003",
    name: "Runtime Data Manipulation",
    type: "technique",
    parentAttackId: "T1565",
    tactic: "Impact",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1565/003"
  },
  {
    attackId: "T1566",
    name: "Phishing",
    type: "technique",
    tactic: "Initial Access",
    attackVersion: "2.7",
    externalUrl: "https://attack.mitre.org/techniques/T1566"
  },
  {
    attackId: "T1566.001",
    name: "Spearphishing Attachment",
    type: "technique",
    parentAttackId: "T1566",
    tactic: "Initial Access",
    attackVersion: "2.2",
    externalUrl: "https://attack.mitre.org/techniques/T1566/001"
  },
  {
    attackId: "T1566.002",
    name: "Spearphishing Link",
    type: "technique",
    parentAttackId: "T1566",
    tactic: "Initial Access",
    attackVersion: "2.8",
    externalUrl: "https://attack.mitre.org/techniques/T1566/002"
  },
  {
    attackId: "T1566.003",
    name: "Spearphishing via Service",
    type: "technique",
    parentAttackId: "T1566",
    tactic: "Initial Access",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1566/003"
  },
  {
    attackId: "T1566.004",
    name: "Spearphishing Voice",
    type: "technique",
    parentAttackId: "T1566",
    tactic: "Initial Access",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1566/004"
  },
  {
    attackId: "T1567",
    name: "Exfiltration Over Web Service",
    type: "technique",
    tactic: "Exfiltration",
    attackVersion: "1.5",
    externalUrl: "https://attack.mitre.org/techniques/T1567"
  },
  {
    attackId: "T1567.001",
    name: "Exfiltration to Code Repository",
    type: "technique",
    parentAttackId: "T1567",
    tactic: "Exfiltration",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1567/001"
  },
  {
    attackId: "T1567.002",
    name: "Exfiltration to Cloud Storage",
    type: "technique",
    parentAttackId: "T1567",
    tactic: "Exfiltration",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1567/002"
  },
  {
    attackId: "T1567.003",
    name: "Exfiltration to Text Storage Sites",
    type: "technique",
    parentAttackId: "T1567",
    tactic: "Exfiltration",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1567/003"
  },
  {
    attackId: "T1567.004",
    name: "Exfiltration Over Webhook",
    type: "technique",
    parentAttackId: "T1567",
    tactic: "Exfiltration",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1567/004"
  },
  {
    attackId: "T1568",
    name: "Dynamic Resolution",
    type: "technique",
    tactic: "Command and Control",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1568"
  },
  {
    attackId: "T1568.001",
    name: "Fast Flux DNS",
    type: "technique",
    parentAttackId: "T1568",
    tactic: "Command and Control",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1568/001"
  },
  {
    attackId: "T1568.002",
    name: "Domain Generation Algorithms",
    type: "technique",
    parentAttackId: "T1568",
    tactic: "Command and Control",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1568/002"
  },
  {
    attackId: "T1568.003",
    name: "DNS Calculation",
    type: "technique",
    parentAttackId: "T1568",
    tactic: "Command and Control",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1568/003"
  },
  {
    attackId: "T1569",
    name: "System Services",
    type: "technique",
    tactic: "Execution",
    attackVersion: "1.4",
    externalUrl: "https://attack.mitre.org/techniques/T1569"
  },
  {
    attackId: "T1569.001",
    name: "Launchctl",
    type: "technique",
    parentAttackId: "T1569",
    tactic: "Execution",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1569/001"
  },
  {
    attackId: "T1569.002",
    name: "Service Execution",
    type: "technique",
    parentAttackId: "T1569",
    tactic: "Execution",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1569/002"
  },
  {
    attackId: "T1569.003",
    name: "Systemctl",
    type: "technique",
    parentAttackId: "T1569",
    tactic: "Execution",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1569/003"
  },
  {
    attackId: "T1570",
    name: "Lateral Tool Transfer",
    type: "technique",
    tactic: "Lateral Movement",
    attackVersion: "1.4",
    externalUrl: "https://attack.mitre.org/techniques/T1570"
  },
  {
    attackId: "T1571",
    name: "Non-Standard Port",
    type: "technique",
    tactic: "Command and Control",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1571"
  },
  {
    attackId: "T1572",
    name: "Protocol Tunneling",
    type: "technique",
    tactic: "Command and Control",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1572"
  },
  {
    attackId: "T1573",
    name: "Encrypted Channel",
    type: "technique",
    tactic: "Command and Control",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1573"
  },
  {
    attackId: "T1573.001",
    name: "Symmetric Cryptography",
    type: "technique",
    parentAttackId: "T1573",
    tactic: "Command and Control",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1573/001"
  },
  {
    attackId: "T1573.002",
    name: "Asymmetric Cryptography",
    type: "technique",
    parentAttackId: "T1573",
    tactic: "Command and Control",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1573/002"
  },
  {
    attackId: "T1574",
    name: "Hijack Execution Flow",
    type: "technique",
    tactic: "Stealth, Execution",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1574"
  },
  {
    attackId: "T1574.001",
    name: "DLL",
    type: "technique",
    parentAttackId: "T1574",
    tactic: "Stealth, Execution",
    attackVersion: "3.0",
    externalUrl: "https://attack.mitre.org/techniques/T1574/001"
  },
  {
    attackId: "T1574.004",
    name: "Dylib Hijacking",
    type: "technique",
    parentAttackId: "T1574",
    tactic: "Stealth, Execution",
    attackVersion: "3.0",
    externalUrl: "https://attack.mitre.org/techniques/T1574/004"
  },
  {
    attackId: "T1574.005",
    name: "Executable Installer File Permissions Weakness",
    type: "technique",
    parentAttackId: "T1574",
    tactic: "Stealth, Execution",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1574/005"
  },
  {
    attackId: "T1574.006",
    name: "Dynamic Linker Hijacking",
    type: "technique",
    parentAttackId: "T1574",
    tactic: "Stealth, Execution",
    attackVersion: "3.0",
    externalUrl: "https://attack.mitre.org/techniques/T1574/006"
  },
  {
    attackId: "T1574.007",
    name: "Path Interception by PATH Environment Variable",
    type: "technique",
    parentAttackId: "T1574",
    tactic: "Stealth, Execution",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1574/007"
  },
  {
    attackId: "T1574.008",
    name: "Path Interception by Search Order Hijacking",
    type: "technique",
    parentAttackId: "T1574",
    tactic: "Stealth, Execution",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1574/008"
  },
  {
    attackId: "T1574.009",
    name: "Path Interception by Unquoted Path",
    type: "technique",
    parentAttackId: "T1574",
    tactic: "Stealth, Execution",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1574/009"
  },
  {
    attackId: "T1574.010",
    name: "Services File Permissions Weakness",
    type: "technique",
    parentAttackId: "T1574",
    tactic: "Stealth, Execution",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1574/010"
  },
  {
    attackId: "T1574.011",
    name: "Services Registry Permissions Weakness",
    type: "technique",
    parentAttackId: "T1574",
    tactic: "Stealth, Execution",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1574/011"
  },
  {
    attackId: "T1574.012",
    name: "COR_PROFILER",
    type: "technique",
    parentAttackId: "T1574",
    tactic: "Stealth, Execution",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1574/012"
  },
  {
    attackId: "T1574.013",
    name: "KernelCallbackTable",
    type: "technique",
    parentAttackId: "T1574",
    tactic: "Stealth, Execution",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1574/013"
  },
  {
    attackId: "T1574.014",
    name: "AppDomainManager",
    type: "technique",
    parentAttackId: "T1574",
    tactic: "Stealth, Execution",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1574/014"
  },
  {
    attackId: "T1578",
    name: "Modify Cloud Compute Infrastructure",
    type: "technique",
    tactic: "Defense Impairment",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1578"
  },
  {
    attackId: "T1578.001",
    name: "Create Snapshot",
    type: "technique",
    parentAttackId: "T1578",
    tactic: "Defense Impairment",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1578/001"
  },
  {
    attackId: "T1578.002",
    name: "Create Cloud Instance",
    type: "technique",
    parentAttackId: "T1578",
    tactic: "Defense Impairment",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1578/002"
  },
  {
    attackId: "T1578.003",
    name: "Delete Cloud Instance",
    type: "technique",
    parentAttackId: "T1578",
    tactic: "Defense Impairment",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1578/003"
  },
  {
    attackId: "T1578.004",
    name: "Revert Cloud Instance",
    type: "technique",
    parentAttackId: "T1578",
    tactic: "Defense Impairment",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1578/004"
  },
  {
    attackId: "T1578.005",
    name: "Modify Cloud Compute Configurations",
    type: "technique",
    parentAttackId: "T1578",
    tactic: "Defense Impairment",
    attackVersion: "3.0",
    externalUrl: "https://attack.mitre.org/techniques/T1578/005"
  },
  {
    attackId: "T1580",
    name: "Cloud Infrastructure Discovery",
    type: "technique",
    tactic: "Discovery",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1580"
  },
  {
    attackId: "T1583",
    name: "Acquire Infrastructure",
    type: "technique",
    tactic: "Resource Development",
    attackVersion: "1.5",
    externalUrl: "https://attack.mitre.org/techniques/T1583"
  },
  {
    attackId: "T1583.001",
    name: "Domains",
    type: "technique",
    parentAttackId: "T1583",
    tactic: "Resource Development",
    attackVersion: "1.4",
    externalUrl: "https://attack.mitre.org/techniques/T1583/001"
  },
  {
    attackId: "T1583.002",
    name: "DNS Server",
    type: "technique",
    parentAttackId: "T1583",
    tactic: "Resource Development",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1583/002"
  },
  {
    attackId: "T1583.003",
    name: "Virtual Private Server",
    type: "technique",
    parentAttackId: "T1583",
    tactic: "Resource Development",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1583/003"
  },
  {
    attackId: "T1583.004",
    name: "Server",
    type: "technique",
    parentAttackId: "T1583",
    tactic: "Resource Development",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1583/004"
  },
  {
    attackId: "T1583.005",
    name: "Botnet",
    type: "technique",
    parentAttackId: "T1583",
    tactic: "Resource Development",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1583/005"
  },
  {
    attackId: "T1583.006",
    name: "Web Services",
    type: "technique",
    parentAttackId: "T1583",
    tactic: "Resource Development",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1583/006"
  },
  {
    attackId: "T1583.007",
    name: "Serverless",
    type: "technique",
    parentAttackId: "T1583",
    tactic: "Resource Development",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1583/007"
  },
  {
    attackId: "T1583.008",
    name: "Malvertising",
    type: "technique",
    parentAttackId: "T1583",
    tactic: "Resource Development",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1583/008"
  },
  {
    attackId: "T1584",
    name: "Compromise Infrastructure",
    type: "technique",
    tactic: "Resource Development",
    attackVersion: "1.6",
    externalUrl: "https://attack.mitre.org/techniques/T1584"
  },
  {
    attackId: "T1584.001",
    name: "Domains",
    type: "technique",
    parentAttackId: "T1584",
    tactic: "Resource Development",
    attackVersion: "1.4",
    externalUrl: "https://attack.mitre.org/techniques/T1584/001"
  },
  {
    attackId: "T1584.002",
    name: "DNS Server",
    type: "technique",
    parentAttackId: "T1584",
    tactic: "Resource Development",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1584/002"
  },
  {
    attackId: "T1584.003",
    name: "Virtual Private Server",
    type: "technique",
    parentAttackId: "T1584",
    tactic: "Resource Development",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1584/003"
  },
  {
    attackId: "T1584.004",
    name: "Server",
    type: "technique",
    parentAttackId: "T1584",
    tactic: "Resource Development",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1584/004"
  },
  {
    attackId: "T1584.005",
    name: "Botnet",
    type: "technique",
    parentAttackId: "T1584",
    tactic: "Resource Development",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1584/005"
  },
  {
    attackId: "T1584.006",
    name: "Web Services",
    type: "technique",
    parentAttackId: "T1584",
    tactic: "Resource Development",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1584/006"
  },
  {
    attackId: "T1584.007",
    name: "Serverless",
    type: "technique",
    parentAttackId: "T1584",
    tactic: "Resource Development",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1584/007"
  },
  {
    attackId: "T1584.008",
    name: "Network Devices",
    type: "technique",
    parentAttackId: "T1584",
    tactic: "Resource Development",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1584/008"
  },
  {
    attackId: "T1585",
    name: "Establish Accounts",
    type: "technique",
    tactic: "Resource Development",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1585"
  },
  {
    attackId: "T1585.001",
    name: "Social Media Accounts",
    type: "technique",
    parentAttackId: "T1585",
    tactic: "Resource Development",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1585/001"
  },
  {
    attackId: "T1585.002",
    name: "Email Accounts",
    type: "technique",
    parentAttackId: "T1585",
    tactic: "Resource Development",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1585/002"
  },
  {
    attackId: "T1585.003",
    name: "Cloud Accounts",
    type: "technique",
    parentAttackId: "T1585",
    tactic: "Resource Development",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1585/003"
  },
  {
    attackId: "T1586",
    name: "Compromise Accounts",
    type: "technique",
    tactic: "Resource Development",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1586"
  },
  {
    attackId: "T1586.001",
    name: "Social Media Accounts",
    type: "technique",
    parentAttackId: "T1586",
    tactic: "Resource Development",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1586/001"
  },
  {
    attackId: "T1586.002",
    name: "Email Accounts",
    type: "technique",
    parentAttackId: "T1586",
    tactic: "Resource Development",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1586/002"
  },
  {
    attackId: "T1586.003",
    name: "Cloud Accounts",
    type: "technique",
    parentAttackId: "T1586",
    tactic: "Resource Development",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1586/003"
  },
  {
    attackId: "T1587",
    name: "Develop Capabilities",
    type: "technique",
    tactic: "Resource Development",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1587"
  },
  {
    attackId: "T1587.001",
    name: "Malware",
    type: "technique",
    parentAttackId: "T1587",
    tactic: "Resource Development",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1587/001"
  },
  {
    attackId: "T1587.002",
    name: "Code Signing Certificates",
    type: "technique",
    parentAttackId: "T1587",
    tactic: "Resource Development",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1587/002"
  },
  {
    attackId: "T1587.003",
    name: "Digital Certificates",
    type: "technique",
    parentAttackId: "T1587",
    tactic: "Resource Development",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1587/003"
  },
  {
    attackId: "T1587.004",
    name: "Exploits",
    type: "technique",
    parentAttackId: "T1587",
    tactic: "Resource Development",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1587/004"
  },
  {
    attackId: "T1588",
    name: "Obtain Capabilities",
    type: "technique",
    tactic: "Resource Development",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1588"
  },
  {
    attackId: "T1588.001",
    name: "Malware",
    type: "technique",
    parentAttackId: "T1588",
    tactic: "Resource Development",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1588/001"
  },
  {
    attackId: "T1588.002",
    name: "Tool",
    type: "technique",
    parentAttackId: "T1588",
    tactic: "Resource Development",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1588/002"
  },
  {
    attackId: "T1588.003",
    name: "Code Signing Certificates",
    type: "technique",
    parentAttackId: "T1588",
    tactic: "Resource Development",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1588/003"
  },
  {
    attackId: "T1588.004",
    name: "Digital Certificates",
    type: "technique",
    parentAttackId: "T1588",
    tactic: "Resource Development",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1588/004"
  },
  {
    attackId: "T1588.005",
    name: "Exploits",
    type: "technique",
    parentAttackId: "T1588",
    tactic: "Resource Development",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1588/005"
  },
  {
    attackId: "T1588.006",
    name: "Vulnerabilities",
    type: "technique",
    parentAttackId: "T1588",
    tactic: "Resource Development",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1588/006"
  },
  {
    attackId: "T1588.007",
    name: "Artificial Intelligence",
    type: "technique",
    parentAttackId: "T1588",
    tactic: "Resource Development",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1588/007"
  },
  {
    attackId: "T1589",
    name: "Gather Victim Identity Information",
    type: "technique",
    tactic: "Reconnaissance",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1589"
  },
  {
    attackId: "T1589.001",
    name: "Credentials",
    type: "technique",
    parentAttackId: "T1589",
    tactic: "Reconnaissance",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1589/001"
  },
  {
    attackId: "T1589.002",
    name: "Email Addresses",
    type: "technique",
    parentAttackId: "T1589",
    tactic: "Reconnaissance",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1589/002"
  },
  {
    attackId: "T1589.003",
    name: "Employee Names",
    type: "technique",
    parentAttackId: "T1589",
    tactic: "Reconnaissance",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1589/003"
  },
  {
    attackId: "T1590",
    name: "Gather Victim Network Information",
    type: "technique",
    tactic: "Reconnaissance",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1590"
  },
  {
    attackId: "T1590.001",
    name: "Domain Properties",
    type: "technique",
    parentAttackId: "T1590",
    tactic: "Reconnaissance",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1590/001"
  },
  {
    attackId: "T1590.002",
    name: "DNS",
    type: "technique",
    parentAttackId: "T1590",
    tactic: "Reconnaissance",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1590/002"
  },
  {
    attackId: "T1590.003",
    name: "Network Trust Dependencies",
    type: "technique",
    parentAttackId: "T1590",
    tactic: "Reconnaissance",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1590/003"
  },
  {
    attackId: "T1590.004",
    name: "Network Topology",
    type: "technique",
    parentAttackId: "T1590",
    tactic: "Reconnaissance",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1590/004"
  },
  {
    attackId: "T1590.005",
    name: "IP Addresses",
    type: "technique",
    parentAttackId: "T1590",
    tactic: "Reconnaissance",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1590/005"
  },
  {
    attackId: "T1590.006",
    name: "Network Security Appliances",
    type: "technique",
    parentAttackId: "T1590",
    tactic: "Reconnaissance",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1590/006"
  },
  {
    attackId: "T1591",
    name: "Gather Victim Org Information",
    type: "technique",
    tactic: "Reconnaissance",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1591"
  },
  {
    attackId: "T1591.001",
    name: "Determine Physical Locations",
    type: "technique",
    parentAttackId: "T1591",
    tactic: "Reconnaissance",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1591/001"
  },
  {
    attackId: "T1591.002",
    name: "Business Relationships",
    type: "technique",
    parentAttackId: "T1591",
    tactic: "Reconnaissance",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1591/002"
  },
  {
    attackId: "T1591.003",
    name: "Identify Business Tempo",
    type: "technique",
    parentAttackId: "T1591",
    tactic: "Reconnaissance",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1591/003"
  },
  {
    attackId: "T1591.004",
    name: "Identify Roles",
    type: "technique",
    parentAttackId: "T1591",
    tactic: "Reconnaissance",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1591/004"
  },
  {
    attackId: "T1592",
    name: "Gather Victim Host Information",
    type: "technique",
    tactic: "Reconnaissance",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1592"
  },
  {
    attackId: "T1592.001",
    name: "Hardware",
    type: "technique",
    parentAttackId: "T1592",
    tactic: "Reconnaissance",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1592/001"
  },
  {
    attackId: "T1592.002",
    name: "Software",
    type: "technique",
    parentAttackId: "T1592",
    tactic: "Reconnaissance",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1592/002"
  },
  {
    attackId: "T1592.003",
    name: "Firmware",
    type: "technique",
    parentAttackId: "T1592",
    tactic: "Reconnaissance",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1592/003"
  },
  {
    attackId: "T1592.004",
    name: "Client Configurations",
    type: "technique",
    parentAttackId: "T1592",
    tactic: "Reconnaissance",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1592/004"
  },
  {
    attackId: "T1593",
    name: "Search Open Websites/Domains",
    type: "technique",
    tactic: "Reconnaissance",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1593"
  },
  {
    attackId: "T1593.001",
    name: "Social Media",
    type: "technique",
    parentAttackId: "T1593",
    tactic: "Reconnaissance",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1593/001"
  },
  {
    attackId: "T1593.002",
    name: "Search Engines",
    type: "technique",
    parentAttackId: "T1593",
    tactic: "Reconnaissance",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1593/002"
  },
  {
    attackId: "T1593.003",
    name: "Code Repositories",
    type: "technique",
    parentAttackId: "T1593",
    tactic: "Reconnaissance",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1593/003"
  },
  {
    attackId: "T1594",
    name: "Search Victim-Owned Websites",
    type: "technique",
    tactic: "Reconnaissance",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1594"
  },
  {
    attackId: "T1595",
    name: "Active Scanning",
    type: "technique",
    tactic: "Reconnaissance",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1595"
  },
  {
    attackId: "T1595.001",
    name: "Scanning IP Blocks",
    type: "technique",
    parentAttackId: "T1595",
    tactic: "Reconnaissance",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1595/001"
  },
  {
    attackId: "T1595.002",
    name: "Vulnerability Scanning",
    type: "technique",
    parentAttackId: "T1595",
    tactic: "Reconnaissance",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1595/002"
  },
  {
    attackId: "T1595.003",
    name: "Wordlist Scanning",
    type: "technique",
    parentAttackId: "T1595",
    tactic: "Reconnaissance",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1595/003"
  },
  {
    attackId: "T1596",
    name: "Search Open Technical Databases",
    type: "technique",
    tactic: "Reconnaissance",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1596"
  },
  {
    attackId: "T1596.001",
    name: "DNS/Passive DNS",
    type: "technique",
    parentAttackId: "T1596",
    tactic: "Reconnaissance",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1596/001"
  },
  {
    attackId: "T1596.002",
    name: "WHOIS",
    type: "technique",
    parentAttackId: "T1596",
    tactic: "Reconnaissance",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1596/002"
  },
  {
    attackId: "T1596.003",
    name: "Digital Certificates",
    type: "technique",
    parentAttackId: "T1596",
    tactic: "Reconnaissance",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1596/003"
  },
  {
    attackId: "T1596.004",
    name: "CDNs",
    type: "technique",
    parentAttackId: "T1596",
    tactic: "Reconnaissance",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1596/004"
  },
  {
    attackId: "T1596.005",
    name: "Scan Databases",
    type: "technique",
    parentAttackId: "T1596",
    tactic: "Reconnaissance",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1596/005"
  },
  {
    attackId: "T1597",
    name: "Search Closed Sources",
    type: "technique",
    tactic: "Reconnaissance",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1597"
  },
  {
    attackId: "T1597.001",
    name: "Threat Intel Vendors",
    type: "technique",
    parentAttackId: "T1597",
    tactic: "Reconnaissance",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1597/001"
  },
  {
    attackId: "T1597.002",
    name: "Purchase Technical Data",
    type: "technique",
    parentAttackId: "T1597",
    tactic: "Reconnaissance",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1597/002"
  },
  {
    attackId: "T1598",
    name: "Phishing for Information",
    type: "technique",
    tactic: "Reconnaissance",
    attackVersion: "1.4",
    externalUrl: "https://attack.mitre.org/techniques/T1598"
  },
  {
    attackId: "T1598.001",
    name: "Spearphishing Service",
    type: "technique",
    parentAttackId: "T1598",
    tactic: "Reconnaissance",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1598/001"
  },
  {
    attackId: "T1598.002",
    name: "Spearphishing Attachment",
    type: "technique",
    parentAttackId: "T1598",
    tactic: "Reconnaissance",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1598/002"
  },
  {
    attackId: "T1598.003",
    name: "Spearphishing Link",
    type: "technique",
    parentAttackId: "T1598",
    tactic: "Reconnaissance",
    attackVersion: "1.7",
    externalUrl: "https://attack.mitre.org/techniques/T1598/003"
  },
  {
    attackId: "T1598.004",
    name: "Spearphishing Voice",
    type: "technique",
    parentAttackId: "T1598",
    tactic: "Reconnaissance",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1598/004"
  },
  {
    attackId: "T1599",
    name: "Network Boundary Bridging",
    type: "technique",
    tactic: "Defense Impairment",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1599"
  },
  {
    attackId: "T1599.001",
    name: "Network Address Translation Traversal",
    type: "technique",
    parentAttackId: "T1599",
    tactic: "Defense Impairment",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1599/001"
  },
  {
    attackId: "T1600",
    name: "Weaken Encryption",
    type: "technique",
    tactic: "Defense Impairment",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1600"
  },
  {
    attackId: "T1600.001",
    name: "Reduce Key Space",
    type: "technique",
    parentAttackId: "T1600",
    tactic: "Defense Impairment",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1600/001"
  },
  {
    attackId: "T1600.002",
    name: "Disable Crypto Hardware",
    type: "technique",
    parentAttackId: "T1600",
    tactic: "Defense Impairment",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1600/002"
  },
  {
    attackId: "T1601",
    name: "Modify System Image",
    type: "technique",
    tactic: "Defense Impairment",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1601"
  },
  {
    attackId: "T1601.001",
    name: "Patch System Image",
    type: "technique",
    parentAttackId: "T1601",
    tactic: "Defense Impairment",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1601/001"
  },
  {
    attackId: "T1601.002",
    name: "Downgrade System Image",
    type: "technique",
    parentAttackId: "T1601",
    tactic: "Defense Impairment",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1601/002"
  },
  {
    attackId: "T1602",
    name: "Data from Configuration Repository",
    type: "technique",
    tactic: "Collection",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1602"
  },
  {
    attackId: "T1602.001",
    name: "SNMP (MIB Dump)",
    type: "technique",
    parentAttackId: "T1602",
    tactic: "Collection",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1602/001"
  },
  {
    attackId: "T1602.002",
    name: "Network Device Configuration Dump",
    type: "technique",
    parentAttackId: "T1602",
    tactic: "Collection",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1602/002"
  },
  {
    attackId: "T1606",
    name: "Forge Web Credentials",
    type: "technique",
    tactic: "Credential Access",
    attackVersion: "1.5",
    externalUrl: "https://attack.mitre.org/techniques/T1606"
  },
  {
    attackId: "T1606.001",
    name: "Web Cookies",
    type: "technique",
    parentAttackId: "T1606",
    tactic: "Credential Access",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1606/001"
  },
  {
    attackId: "T1606.002",
    name: "SAML Tokens",
    type: "technique",
    parentAttackId: "T1606",
    tactic: "Credential Access",
    attackVersion: "1.4",
    externalUrl: "https://attack.mitre.org/techniques/T1606/002"
  },
  {
    attackId: "T1608",
    name: "Stage Capabilities",
    type: "technique",
    tactic: "Resource Development",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1608"
  },
  {
    attackId: "T1608.001",
    name: "Upload Malware",
    type: "technique",
    parentAttackId: "T1608",
    tactic: "Resource Development",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1608/001"
  },
  {
    attackId: "T1608.002",
    name: "Upload Tool",
    type: "technique",
    parentAttackId: "T1608",
    tactic: "Resource Development",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1608/002"
  },
  {
    attackId: "T1608.003",
    name: "Install Digital Certificate",
    type: "technique",
    parentAttackId: "T1608",
    tactic: "Resource Development",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1608/003"
  },
  {
    attackId: "T1608.004",
    name: "Drive-by Target",
    type: "technique",
    parentAttackId: "T1608",
    tactic: "Resource Development",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1608/004"
  },
  {
    attackId: "T1608.005",
    name: "Link Target",
    type: "technique",
    parentAttackId: "T1608",
    tactic: "Resource Development",
    attackVersion: "1.4",
    externalUrl: "https://attack.mitre.org/techniques/T1608/005"
  },
  {
    attackId: "T1608.006",
    name: "SEO Poisoning",
    type: "technique",
    parentAttackId: "T1608",
    tactic: "Resource Development",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1608/006"
  },
  {
    attackId: "T1609",
    name: "Container Administration Command",
    type: "technique",
    tactic: "Execution",
    attackVersion: "1.3",
    externalUrl: "https://attack.mitre.org/techniques/T1609"
  },
  {
    attackId: "T1610",
    name: "Deploy Container",
    type: "technique",
    tactic: "Execution",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1610"
  },
  {
    attackId: "T1611",
    name: "Escape to Host",
    type: "technique",
    tactic: "Privilege Escalation",
    attackVersion: "1.6",
    externalUrl: "https://attack.mitre.org/techniques/T1611"
  },
  {
    attackId: "T1612",
    name: "Build Image on Host",
    type: "technique",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1612"
  },
  {
    attackId: "T1613",
    name: "Container and Resource Discovery",
    type: "technique",
    tactic: "Discovery",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1613"
  },
  {
    attackId: "T1614",
    name: "System Location Discovery",
    type: "technique",
    tactic: "Discovery",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1614"
  },
  {
    attackId: "T1614.001",
    name: "System Language Discovery",
    type: "technique",
    parentAttackId: "T1614",
    tactic: "Discovery",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1614/001"
  },
  {
    attackId: "T1615",
    name: "Group Policy Discovery",
    type: "technique",
    tactic: "Discovery",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1615"
  },
  {
    attackId: "T1619",
    name: "Cloud Storage Object Discovery",
    type: "technique",
    tactic: "Discovery",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1619"
  },
  {
    attackId: "T1620",
    name: "Reflective Code Loading",
    type: "technique",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1620"
  },
  {
    attackId: "T1621",
    name: "Multi-Factor Authentication Request Generation",
    type: "technique",
    tactic: "Credential Access",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1621"
  },
  {
    attackId: "T1622",
    name: "Debugger Evasion",
    type: "technique",
    tactic: "Stealth, Discovery",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1622"
  },
  {
    attackId: "T1647",
    name: "Plist File Modification",
    type: "technique",
    tactic: "Defense Impairment",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1647"
  },
  {
    attackId: "T1648",
    name: "Serverless Execution",
    type: "technique",
    tactic: "Execution",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1648"
  },
  {
    attackId: "T1649",
    name: "Steal or Forge Authentication Certificates",
    type: "technique",
    tactic: "Credential Access",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1649"
  },
  {
    attackId: "T1650",
    name: "Acquire Access",
    type: "technique",
    tactic: "Resource Development",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1650"
  },
  {
    attackId: "T1651",
    name: "Cloud Administration Command",
    type: "technique",
    tactic: "Execution",
    attackVersion: "2.1",
    externalUrl: "https://attack.mitre.org/techniques/T1651"
  },
  {
    attackId: "T1652",
    name: "Device Driver Discovery",
    type: "technique",
    tactic: "Discovery",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1652"
  },
  {
    attackId: "T1653",
    name: "Power Settings",
    type: "technique",
    tactic: "Persistence",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/techniques/T1653"
  },
  {
    attackId: "T1654",
    name: "Log Enumeration",
    type: "technique",
    tactic: "Discovery",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1654"
  },
  {
    attackId: "T1657",
    name: "Financial Theft",
    type: "technique",
    tactic: "Impact",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1657"
  },
  {
    attackId: "T1659",
    name: "Content Injection",
    type: "technique",
    tactic: "Initial Access, Command and Control",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1659"
  },
  {
    attackId: "T1665",
    name: "Hide Infrastructure",
    type: "technique",
    tactic: "Command and Control",
    attackVersion: "1.2",
    externalUrl: "https://attack.mitre.org/techniques/T1665"
  },
  {
    attackId: "T1666",
    name: "Modify Cloud Resource Hierarchy",
    type: "technique",
    tactic: "Defense Impairment",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1666"
  },
  {
    attackId: "T1667",
    name: "Email Bombing",
    type: "technique",
    tactic: "Impact",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1667"
  },
  {
    attackId: "T1668",
    name: "Exclusive Control",
    type: "technique",
    tactic: "Persistence",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1668"
  },
  {
    attackId: "T1669",
    name: "Wi-Fi Networks",
    type: "technique",
    tactic: "Initial Access",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1669"
  },
  {
    attackId: "T1671",
    name: "Cloud Application Integration",
    type: "technique",
    tactic: "Persistence",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1671"
  },
  {
    attackId: "T1673",
    name: "Virtual Machine Discovery",
    type: "technique",
    tactic: "Discovery",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1673"
  },
  {
    attackId: "T1674",
    name: "Input Injection",
    type: "technique",
    tactic: "Execution",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1674"
  },
  {
    attackId: "T1675",
    name: "ESXi Administration Command",
    type: "technique",
    tactic: "Execution",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1675"
  },
  {
    attackId: "T1677",
    name: "Poisoned Pipeline Execution",
    type: "technique",
    tactic: "Execution",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1677"
  },
  {
    attackId: "T1678",
    name: "Delay Execution",
    type: "technique",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1678"
  },
  {
    attackId: "T1679",
    name: "Selective Exclusion",
    type: "technique",
    tactic: "Stealth",
    attackVersion: "2.0",
    externalUrl: "https://attack.mitre.org/techniques/T1679"
  },
  {
    attackId: "T1680",
    name: "Local Storage Discovery",
    type: "technique",
    tactic: "Discovery",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1680"
  },
  {
    attackId: "T1681",
    name: "Search Threat Vendor Data",
    type: "technique",
    tactic: "Reconnaissance",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1681"
  },
  {
    attackId: "T1682",
    name: "Query Public AI Services",
    type: "technique",
    tactic: "Reconnaissance",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1682"
  },
  {
    attackId: "T1683",
    name: "Generate Content",
    type: "technique",
    tactic: "Resource Development",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1683"
  },
  {
    attackId: "T1683.001",
    name: "Written Content",
    type: "technique",
    parentAttackId: "T1683",
    tactic: "Resource Development",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1683/001"
  },
  {
    attackId: "T1683.002",
    name: "Audio-Visual Content",
    type: "technique",
    parentAttackId: "T1683",
    tactic: "Resource Development",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1683/002"
  },
  {
    attackId: "T1684",
    name: "Social Engineering",
    type: "technique",
    tactic: "Stealth",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1684"
  },
  {
    attackId: "T1684.001",
    name: "Impersonation",
    type: "technique",
    parentAttackId: "T1684",
    tactic: "Stealth",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1684/001"
  },
  {
    attackId: "T1684.002",
    name: "Email Spoofing",
    type: "technique",
    parentAttackId: "T1684",
    tactic: "Stealth",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1684/002"
  },
  {
    attackId: "T1685",
    name: "Disable or Modify Tools",
    type: "technique",
    tactic: "Defense Impairment",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1685"
  },
  {
    attackId: "T1685.001",
    name: "Disable or Modify Windows Event Log",
    type: "technique",
    parentAttackId: "T1685",
    tactic: "Defense Impairment",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1685/001"
  },
  {
    attackId: "T1685.002",
    name: "Disable or Modify Cloud Log",
    type: "technique",
    parentAttackId: "T1685",
    tactic: "Defense Impairment",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1685/002"
  },
  {
    attackId: "T1685.003",
    name: "Modify or Spoof Tool UI",
    type: "technique",
    parentAttackId: "T1685",
    tactic: "Defense Impairment",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1685/003"
  },
  {
    attackId: "T1685.004",
    name: "Disable or Modify Linux Audit System Log",
    type: "technique",
    parentAttackId: "T1685",
    tactic: "Defense Impairment",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1685/004"
  },
  {
    attackId: "T1685.005",
    name: "Clear Windows Event Logs",
    type: "technique",
    parentAttackId: "T1685",
    tactic: "Defense Impairment",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1685/005"
  },
  {
    attackId: "T1685.006",
    name: "Clear Linux or Mac System Logs",
    type: "technique",
    parentAttackId: "T1685",
    tactic: "Defense Impairment",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1685/006"
  },
  {
    attackId: "T1686",
    name: "Disable or Modify System Firewall",
    type: "technique",
    tactic: "Defense Impairment",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1686"
  },
  {
    attackId: "T1686.001",
    name: "Cloud Firewall",
    type: "technique",
    parentAttackId: "T1686",
    tactic: "Defense Impairment",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1686/001"
  },
  {
    attackId: "T1686.002",
    name: "Network Device Firewall",
    type: "technique",
    parentAttackId: "T1686",
    tactic: "Defense Impairment",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1686/002"
  },
  {
    attackId: "T1686.003",
    name: "Windows Host Firewall",
    type: "technique",
    parentAttackId: "T1686",
    tactic: "Defense Impairment",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1686/003"
  },
  {
    attackId: "T1687",
    name: "Exploitation for Defense Impairment",
    type: "technique",
    tactic: "Defense Impairment",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1687"
  },
  {
    attackId: "T1688",
    name: "Safe Mode Boot",
    type: "technique",
    tactic: "Defense Impairment",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1688"
  },
  {
    attackId: "T1689",
    name: "Downgrade Attack",
    type: "technique",
    tactic: "Defense Impairment",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1689"
  },
  {
    attackId: "T1690",
    name: "Prevent Command History Logging",
    type: "technique",
    tactic: "Defense Impairment",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/techniques/T1690"
  },
  {
    attackId: "TA0001",
    name: "Initial Access",
    type: "tactic",
    tactic: "Initial Access",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/tactics/TA0001"
  },
  {
    attackId: "TA0002",
    name: "Execution",
    type: "tactic",
    tactic: "Execution",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/tactics/TA0002"
  },
  {
    attackId: "TA0003",
    name: "Persistence",
    type: "tactic",
    tactic: "Persistence",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/tactics/TA0003"
  },
  {
    attackId: "TA0004",
    name: "Privilege Escalation",
    type: "tactic",
    tactic: "Privilege Escalation",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/tactics/TA0004"
  },
  {
    attackId: "TA0005",
    name: "Stealth",
    type: "tactic",
    tactic: "Stealth",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/tactics/TA0005"
  },
  {
    attackId: "TA0006",
    name: "Credential Access",
    type: "tactic",
    tactic: "Credential Access",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/tactics/TA0006"
  },
  {
    attackId: "TA0007",
    name: "Discovery",
    type: "tactic",
    tactic: "Discovery",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/tactics/TA0007"
  },
  {
    attackId: "TA0008",
    name: "Lateral Movement",
    type: "tactic",
    tactic: "Lateral Movement",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/tactics/TA0008"
  },
  {
    attackId: "TA0009",
    name: "Collection",
    type: "tactic",
    tactic: "Collection",
    attackVersion: "1.1",
    externalUrl: "https://attack.mitre.org/tactics/TA0009"
  },
  {
    attackId: "TA0010",
    name: "Exfiltration",
    type: "tactic",
    tactic: "Exfiltration",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/tactics/TA0010"
  },
  {
    attackId: "TA0011",
    name: "Command and Control",
    type: "tactic",
    tactic: "Command and Control",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/tactics/TA0011"
  },
  {
    attackId: "TA0040",
    name: "Impact",
    type: "tactic",
    tactic: "Impact",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/tactics/TA0040"
  },
  {
    attackId: "TA0042",
    name: "Resource Development",
    type: "tactic",
    tactic: "Resource Development",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/tactics/TA0042"
  },
  {
    attackId: "TA0043",
    name: "Reconnaissance",
    type: "tactic",
    tactic: "Reconnaissance",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/tactics/TA0043"
  },
  {
    attackId: "TA0112",
    name: "Defense Impairment",
    type: "tactic",
    tactic: "Defense Impairment",
    attackVersion: "1.0",
    externalUrl: "https://attack.mitre.org/tactics/TA0112"
  }
];
