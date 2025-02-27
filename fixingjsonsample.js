const string = `\n{\n    \"response\": \"Title: How to Break Bad Habits\\nSubtitle: Rewire Your Brain with Neuroscience-Backed Strategies for Real, Lasting Change\\n\\nTable of Contents\\nDesigned to address reviewer frustrations while leveraging their interests\\n\\n---\\nIntroduction: Why Willpower Isn’t Enough\\n- The neuroscience of habit loops (simplified)\\n- How this book delivers actionable strategies (not just theory)\\n- A preview of science-backed tools for immediate use\\n\\nChapter 1: The Habit Brain: How Wiring Works\\n- The 3-step habit cycle (cue → routine → reward)\\n- Interactive exercise: Map your own habit loops\\n\\nChapter 2: Neuroplasticity: Your Brain’s Secret Superpower\\n- Cutting-edge research on rewiring (skip outdated studies)\\n- Worksheet: “Small changes, big results” daily tracker\\n\\nChapter 3: Break the Cycle: Science-Backed Triggers\\n- Replace, don’t erase: The “habit substitution” method\\n- Case study resolved: How Sarah quit stress-eating using environmental hacks\\n\\nChapter 4: Addiction Beyond 12 Steps\\n- Why traditional methods fail—and what neuroscience suggests instead\\n- Action plan: Dopamine detox + craving delay tactics\\n\\nChapter 5: Mindfulness Without the Buzzwords\\n- Simple, non-woo techniques to disrupt autopilot\\n- 5-minute daily exercise: Sensory grounding for impulse control\\n\\nChapter 6: The Choice Theory Shortcut\\n- Applying Glasser’s framework (finally!) to habit change\\n- Self-assessment: Align habits with your core needs\\n\\nChapter 7: Procrastination: Hack Your Future Self\\n- “Time travel” visualization + accountability tweaks\\n\\nChapter 8: Stress Habits: Rewire Anxiety on the Fly\\n- Vagal nerve tricks and quick resets\\n\\nChapter 9: Social Triggers: Peer Pressure, Solved\\n- Boundary scripts + “habit immunity” training\\n\\nChapter 10: Relapse? Reset in 15 Minutes\\n- The neuroscience of self-compassion (with scripts)\\n\\nChapter 11: Progress Over Perfection\\n- Tracker template: Celebrate micro-wins without guilt\\n\\n\\nHere’s a guide to writing the book’s content, structured to avoid pitfalls and amplify strengths based on the reviews and your TOC:\\n\\n---\\n\\n### 1. Avoid the Pitfalls\\n#### Problem: \\\"Too much science, not enough action\\\"\\n- Solution:\\n  - Every chapter starts with a 1–2-paragraph neuroscience hook (e.g., \\\"Why your brain craves instant gratification\\\"), then immediately pivots to actionable steps.\\n  - Use metaphors (e.g., \\\"Your amygdala is like a smoke alarm—here’s how to reset it\\\").\\n  - No jargon without translation (e.g., \\\"Dopamine = your brain’s 'reward currency'\\\").\\n\\n#### Problem: \\\"Recycled advice, nothing new\\\"\\n- Solution:\\n  - Focus on 2020s research (e.g., habit stacking + dopamine fasting), cite recent studies (post-2018), and avoid overused examples (Pavlov’s dogs, rat mazes).\\n  - Contrast old vs. new strategies (e.g., \\\"Why 12-step programs fail 70% of people—and what to do instead\\\").\\n\\n#### Problem: \\\"Boring, too academic\\\"\\n- Solution:\\n  - Tone: Casual, motivational, and conversational (e.g., \\\"Let’s hack your brain’s lazy default settings\\\").\\n  - Use bullet points, bold headers, and \\\"cheat sheets\\\" to break up text.\\n  - Inject humor (e.g., \\\"Your prefrontal cortex is like a tired parent—here’s how to give it coffee\\\").\\n\\n#### Problem: \\\"No practical tools\\\"\\n- Solution:\\n  - End every chapter with a \\\"Try This Today\\\" box (e.g., \\\"The 5-Minute Craving Killer: Step-by-Step\\\").\\n  - Case studies show transformation (e.g., \\\"How Mark used Chapter 4’s method to quit vaping in 2 weeks\\\").\\n\\n---\\n\\n### 2. Build on Strengths\\n#### Strength: Readers loved neuroscience but wanted it applied\\n- Action:\\n  - Link brain regions to habits (e.g., \\\"Your basal ganglia autopilots bad habits—here’s how to hijack it\\\").\\n  - Use diagrams (e.g., \\\"Habit Loop vs. Rewired Loop\\\") with plain-English captions.\\n  - Debunk myths (e.g., \\\"Willpower isn’t finite—here’s the 2023 study that proves it\\\").\\n\\n#### Strength: Readers wanted \\\"simple frameworks\\\"\\n- Action:\\n  - Repeat core models (e.g., Glasser’s Choice Theory) across chapters to reinforce learning.\\n  - Create mnemonics (e.g., \\\"The 4 R’s: Recognize, Replace, Reward, Repeat\\\").\\n\\n---\\n\\n### 3. Chapter Writing Template\\nFor each chapter, structure content as:\\n1. Hook: Relatable problem (e.g., \\\"Why you snack when stressed\\\").\\n2. Science Lite: 1–2 key neuroscience insights (cite 1–2 studies max).\\n3. Framework: Simple model (e.g., flowchart, equation: Craving + Delay = Freedom).\\n4. Case Study: Success story using the method (show progress, not just pain).\\n5. Action Steps: Numbered, scripted exercises (e.g., \\\"Script to say when cravings hit\\\").\\n6. Troubleshooting: Anticipate failures (e.g., \\\"What if you relapse? Do this\\\").\\n\\n---\\n\\n### 4. Style Rules\\n- Avoid:\\n  - Passive voice (\\\"Studies show…\\\" → \\\"You can use this study to…\\\").\\n  - Vague claims (\\\"Research proves…\\\" → \\\"A 2022 UCLA trial found…\\\").\\n  - Overpromising (\\\"Cure addiction forever\\\" → \\\"Reduce relapses by 40%\").\\n- Use:\\n  - Second-person \\\"you\\\" and imperative verbs (\\\"Reset your trigger response now\\\").\\n  - Power words: \\\"Hack,\\\" \\\"Reset,\\\" \\\"Rewire,\\\" \\\"Shortcut.\\\"\\n  - Subheadings as questions (\\\"What if you hate journaling? Try voice memos\\\").\\n\\n---\\n\\n### 5. Anti-Boring Checklist\\nBefore finalizing a chapter, ask:\\n1. Did I turn theory into a tool?\\n2. Is there a downloadable resource tied to this section?\\n3. Does the case study have a resolution?\\n4. Would a 15-year-old understand the science?\\n5. Is there zero psychobabble?\\n\\n---\\n\\nBy following this guide, the book is practical, modern, and engaging—directly addressing what frustrated readers *and* doubling down on what they wanted but didn’t get.\"\n}`;

const errorString = `SyntaxError: Expected ',' or '}' after property value in JSON at position 4968 (line 2 column 4967)`;
function getErrorContext(errorString, string) {
  const positionMatch = errorString.match(/position (\d+)/); // Use regex to find "position" and capture digits

  if (!positionMatch) {
    return null;
  }

  const errorPosition = parseInt(positionMatch[1], 10); // Convert captured digits to a number

  const contextLength = 5; // Number of characters before and after

  let startIndex = Math.max(0, errorPosition - contextLength); // Ensure start index is not negative
  let endIndex = Math.min(string.length, errorPosition + contextLength + 1); // Ensure end index is within string bounds

  const context = string.substring(startIndex, endIndex);

  return {
    position: errorPosition,
    context: context,
  };
}

const errorContext = getErrorContext(errorString, string);

if (!errorContext) {
  console.error("Could not get Position because it was not indicated in error.message. Trying another way to fix JSON"); // Log error message if position extraction failed
} else {
  console.log("Error Position:", errorContext.position);
  console.log("Context around error:");
  console.log(`...${errorContext.context}...`);
}


// let a = JSON.parse(JSON.stringify(string)).trim();

// try {
//     a = JSON.parse(a);
// } catch (error) {
//     console.log(a);
//     console.log(a.charAt(4960), a.charAt(4961), a.charAt(4962), a.charAt(4963), a.charAt(4964), a.charAt(4965), a.charAt(4966), a.charAt(4967), a.charAt(4968), a.charAt(4969), a.charAt(4970));
//     // checkTermination(error);
//     throw error
//     // a = JSON.parse(a);
// }

// console.log(a);

// const b = JSON.stringify(a);
// console.log(b)
// console.log(JSON.parse(JSON.parse(b)));

function checkTermination(error) {
    if (error.message.includes("Expected ',' or '}' after property value in JSON")){
        if (a.endsWith('"')) {
            a = a.concat('}')
            return true
        }
    }
    return false
}