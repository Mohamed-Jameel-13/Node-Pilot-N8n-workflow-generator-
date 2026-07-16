// Quick test for intent detection regex

const testCases = [
  // Should NOT trigger list
  { text: "create a lead generation system for free completely", shouldList: false },
  { text: "build a workflow", shouldList: false },
  { text: "in send email node set from email as test@test.com", shouldList: false },
  { text: "did you deployed the updated", shouldList: false },
  { text: "the following workflow is unarchived test workflow", shouldList: false },
  { text: "make a workflow", shouldList: false },
  { text: "what should I do", shouldList: false },
  
  // Should trigger list
  { text: "list workflows", shouldList: true },
  { text: "list all workflows", shouldList: true },
  { text: "show workflows", shouldList: true },
  { text: "show me all workflows", shouldList: true },
  { text: "get workflows", shouldList: true },
  { text: "fetch all my workflows", shouldList: true },
  { text: "display workflows", shouldList: true },
  { text: "workflows list", shouldList: true },
  { text: "list all n8n workflows", shouldList: true },
];

// New strict regex
const isListIntent = (text) => {
  const userTextLower = text.toLowerCase().trim();
  return /^(list|show|get|fetch|display)(\s+me)?(\s+(all|my|the))?\s*workflows?/i.test(userTextLower) ||
         /workflows?\s+(list|available)/i.test(userTextLower);
};

console.log("Testing Intent Detection Regex\n" + "=".repeat(50));

let passed = 0;
let failed = 0;

testCases.forEach(({ text, shouldList }) => {
  const result = isListIntent(text);
  const status = result === shouldList ? "✅ PASS" : "❌ FAIL";
  
  if (result === shouldList) passed++;
  else failed++;
  
  console.log(`${status}: "${text}"`);
  console.log(`  Expected: ${shouldList}, Got: ${result}\n`);
});

console.log("=".repeat(50));
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`Success Rate: ${Math.round((passed / testCases.length) * 100)}%`);

if (failed === 0) {
  console.log("\n🎉 All tests passed! Intent detection is working correctly.");
} else {
  console.log("\n⚠️  Some tests failed. Review the regex pattern.");
}
