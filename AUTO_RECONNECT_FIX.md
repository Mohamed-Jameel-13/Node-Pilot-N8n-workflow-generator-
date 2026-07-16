# Auto-Reconnect Fix - Smart Node Deletion

## Problem Identified

**User Request**: "If I ask it to remove something it should wire to the disconnected from to node right and configure both nodes right"

**Scenario**:
```
Before: A → B → C
User: "remove B"
Expected: A → C (reconnect automatically)
Before Fix: A   C (disconnected, broken workflow)
```

**Issue**: When deleting a middle node, the AI would:
- ❌ Delete the node
- ❌ Remove all edges connected to it
- ❌ Leave workflow broken (A and C disconnected)
- ❌ Not reconnect predecessor to successor

---

## Solution Applied

### 1. Enhanced System Prompt

Added explicit reconnection logic instructions:

```
**RECONNECTION LOGIC**: When removing a node from a chain:
- If node has incoming connection from node A
- And node has outgoing connection to node C
- You MUST first connect A→C (using connect_nodes)
- Then delete the middle node
- This preserves workflow continuity
- Example: Workflow is Trigger→Transform→Email. User says "remove Transform". 
  You should: (1) connect Trigger→Email, (2) delete Transform, (3) deploy.
```

### 2. Updated Rule #6

```
6. When user asks to remove/delete a node, you MUST:
   a) Identify which node to delete
   b) **Check if node has incoming and outgoing connections**
   c) **If yes, reconnect the predecessor node directly to the successor node** using connect_nodes
   d) Use delete_node tool with the node ID
   e) **Immediately call deploy_workflow_to_n8n** to save to n8n
   Example: If deleting node B in chain A→B→C, first connect A→C, then delete B, then deploy.
```

### 3. Enhanced delete_node Tool Description

```
"Delete a node from the workflow canvas. IMPORTANT: If the node has both incoming and 
outgoing connections (it's in the middle of a chain), you should FIRST reconnect its 
predecessor to its successor using connect_nodes BEFORE deleting it to maintain workflow 
continuity. Then call deploy_workflow_to_n8n to save."
```

### 4. Smart Frontend Handler

The frontend now provides intelligent feedback:

```typescript
// When deleting a node, detect connections and inform AI
const incomingEdges = localEdges.filter(e => e.target === args.id);
const outgoingEdges = localEdges.filter(e => e.source === args.id);

// Get node labels for better reporting
const sources = incomingEdges.map(e => ({
  id: e.source, 
  label: localNodes.find(n => n.id === e.source)?.data.label
}));

const targets = outgoingEdges.map(e => ({
  id: e.target,
  label: localNodes.find(n => n.id === e.target)?.data.label
}));

// If node is in the middle of a chain, warn AI
if (sources.length > 0 && targets.length > 0) {
  resultMessage = `Node deleted. WARNING: This node was connecting ${sourceLabels} 
  to ${targetLabels}. Consider reconnecting: connect_nodes(source_id="${sources[0].id}", 
  target_id="${targets[0].id}")`;
}
```

This gives the AI actionable information about what needs to be reconnected.

---

## Correct Workflow Now

### Example 1: Delete Middle Node

**Scenario**: Workflow is `Webhook → Transform → Email`

**User**: "remove the transform node"

**AI Behavior**:
```
Step 1: Identify node to delete (Transform, id="node2")
Step 2: Check connections:
        - Incoming: Webhook (node1) → Transform (node2)
        - Outgoing: Transform (node2) → Email (node3)
Step 3: Call connect_nodes(source_id="node1", target_id="node3")  ← RECONNECT!
Step 4: Call delete_node(id="node2")
Step 5: Call deploy_workflow_to_n8n()
Step 6: Respond: "I have removed the Transform node and reconnected Webhook to Email."
```

**Result**: ✅ Workflow is now `Webhook → Email` (functional)

---

### Example 2: Delete End Node

**Scenario**: Workflow is `Webhook → Transform → Email`

**User**: "remove the email node"

**AI Behavior**:
```
Step 1: Identify node to delete (Email, id="node3")
Step 2: Check connections:
        - Incoming: Transform (node2) → Email (node3)
        - Outgoing: None
Step 3: No reconnection needed (end node)
Step 4: Call delete_node(id="node3")
Step 5: Call deploy_workflow_to_n8n()
Step 6: Respond: "I have removed the Email node."
```

**Result**: ✅ Workflow is now `Webhook → Transform` (functional)

---

### Example 3: Delete Start Node

**Scenario**: Workflow is `Webhook → Transform → Email`

**User**: "remove the webhook node"

**AI Behavior**:
```
Step 1: Identify node to delete (Webhook, id="node1")
Step 2: Check connections:
        - Incoming: None
        - Outgoing: Webhook (node1) → Transform (node2)
Step 3: No reconnection needed (start node)
Step 4: Call delete_node(id="node1")
Step 5: Call deploy_workflow_to_n8n()
Step 6: Respond: "I have removed the Webhook node."
```

**Result**: ✅ Workflow is now `Transform → Email` (functional, but needs new trigger)

---

### Example 4: Delete Node with Multiple Inputs/Outputs

**Scenario**: Complex workflow
```
     Webhook → Split
        ↓         ↓
    Process   Transform
        ↓         ↓
         → Merge → Email
```

**User**: "remove the merge node"

**AI Behavior**:
```
Step 1: Identify node to delete (Merge, id="node5")
Step 2: Check connections:
        - Incoming: Process (node3) → Merge (node5)
                   Transform (node4) → Merge (node5)
        - Outgoing: Merge (node5) → Email (node6)
Step 3: Multiple reconnections needed:
        Call connect_nodes(source_id="node3", target_id="node6")
        Call connect_nodes(source_id="node4", target_id="node6")
Step 4: Call delete_node(id="node5")
Step 5: Call deploy_workflow_to_n8n()
Step 6: Respond: "I have removed the Merge node and reconnected both Process and 
        Transform to Email."
```

**Result**: ✅ Both branches now connect directly to Email

---

## Frontend Smart Detection

The frontend now provides this information to the AI:

```
Tool Response from delete_node:
"Node deleted. WARNING: This node was connecting Webhook Trigger to Send Email. 
Consider reconnecting: connect_nodes(source_id="node1", target_id="node3")"
```

This makes it VERY CLEAR to the AI that reconnection is needed and even suggests the exact tool call.

---

## Edge Cases Handled

### Case 1: Isolated Node (No Connections)
```
User: "remove node X"
Result: Node deleted, no reconnection needed
```

### Case 2: Branch Start (Multiple Outputs)
```
Before: A → B → C
             ↓
             D
User: "remove B"
Result: A → C and A → D (reconnect both)
```

### Case 3: Branch End (Multiple Inputs)
```
Before: A → B
        C → ↓
            D
User: "remove B"  
Result: A → D and C → D (preserve both inputs)
```

### Case 4: Loop/Cycle Detection
```
If node is part of a loop, deletion still works
AI will attempt to reconnect logically
```

---

## Testing Checklist

### Manual Tests:

1. **Delete Middle Node**:
   - [ ] Create: A → B → C
   - [ ] Ask: "remove B"
   - [ ] Verify: A → C (reconnected)
   - [ ] Check n8n: Connection exists

2. **Delete Start Node**:
   - [ ] Create: A → B → C
   - [ ] Ask: "remove A"
   - [ ] Verify: B → C (intact)
   - [ ] Check n8n: No connection from A

3. **Delete End Node**:
   - [ ] Create: A → B → C
   - [ ] Ask: "remove C"
   - [ ] Verify: A → B (intact)
   - [ ] Check n8n: No connection to C

4. **Delete Node with Multiple Outputs**:
   - [ ] Create: A → B → C and B → D
   - [ ] Ask: "remove B"
   - [ ] Verify: A → C and A → D
   - [ ] Check n8n: Both connections exist

5. **Delete Node with Multiple Inputs**:
   - [ ] Create: A → C and B → C
   - [ ] Ask: "remove C"
   - [ ] Verify: A and B disconnected
   - [ ] Check n8n: C removed

---

## Comparison: Before vs After

### BEFORE (Broken):
```
Workflow: Webhook → Transform → Email
User: "remove transform"
AI: [delete_node(id="node2")]
AI: [deploy_workflow_to_n8n()]
Result: Webhook    Email (disconnected ❌)
n8n State: Broken workflow
```

### AFTER (Fixed):
```
Workflow: Webhook → Transform → Email
User: "remove transform"
AI: [connect_nodes(source="node1", target="node3")]  ← NEW!
AI: [delete_node(id="node2")]
AI: [deploy_workflow_to_n8n()]
Result: Webhook → Email (reconnected ✅)
n8n State: Functional workflow
```

---

## Implementation Details

### System Prompt Location:
- File: `backend/src/index.ts`
- Lines: ~461-475 (RECONNECTION LOGIC section)
- Lines: ~485-490 (Rule #6 with reconnection steps)

### Tool Description Location:
- File: `backend/src/index.ts`
- Lines: ~568-572 (delete_node description)

### Frontend Handler Location:
- File: `frontend/src/app/dashboard/[workspaceId]/canvas/page.tsx`
- Lines: ~390-415 (Smart delete_node handler with connection detection)

---

## Why This Works

1. **Triple Reinforcement**:
   - System prompt explains reconnection logic
   - Rule #6 provides step-by-step instructions
   - Tool description reminds about reconnection

2. **Smart Feedback**:
   - Frontend tells AI exactly what was disconnected
   - Suggests the exact connect_nodes call needed
   - Makes it obvious when reconnection is required

3. **LLM-Friendly**:
   - Clear, explicit instructions
   - Example scenarios provided
   - Actionable tool call suggestions

---

## Additional Improvements

### 1. Node Configuration
The AI should also preserve any important settings when reconnecting:
- If deleted node had filters/conditions, suggest adding them elsewhere
- If deleted node had transformations, suggest alternative approach

### 2. User Confirmation (Future)
For complex deletions, AI could ask:
```
AI: "Removing Transform will disconnect Webhook from Email. 
     Should I reconnect them directly? (yes/no)"
```

### 3. Undo Support (Future)
Store deleted node in history for potential restoration

---

## Files Modified

1. **backend/src/index.ts**:
   - Added RECONNECTION LOGIC section
   - Updated Rule #6 with reconnection steps
   - Enhanced delete_node tool description

2. **frontend/src/app/dashboard/[workspaceId]/canvas/page.tsx**:
   - Enhanced delete_node handler with connection detection
   - Added smart warning messages
   - Provided actionable reconnection suggestions

---

## Status

✅ **READY FOR TESTING**

The system now:
- Detects when deleted nodes have connections
- Instructs AI to reconnect predecessor→successor
- Provides smart warnings about disconnections
- Suggests exact tool calls for reconnection
- Maintains workflow continuity automatically

**Expected Behavior**: When deleting any middle node, AI will automatically reconnect the chain to keep the workflow functional. 🔗
