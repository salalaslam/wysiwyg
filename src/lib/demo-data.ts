export type ChatRole = "assistant" | "user";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

export type DemoPrompt = {
  id: string;
  label: string;
  intent: string;
  response: string;
  html: string;
};

export const initialDocumentHtml = `
  <h1>Acme Specialty Clinic</h1>
  <p><strong>Patient:</strong> Jordan Rivera</p>
  <p><strong>Date:</strong> May 8, 2026</p>
  <p><strong>Draft type:</strong> Prior authorization support letter</p>
  <p>
    This workspace is a proof of concept for chat-assisted document drafting. Use the prompts on the left to generate sections,
    rewrite tone, or produce a structured summary. You can keep refining the draft directly in the editor.
  </p>
  <h2>Clinical summary</h2>
  <p>
    Jordan Rivera presents with persistent lumbar radiculopathy causing reduced mobility, disturbed sleep, and limited tolerance
    for seated work. Conservative treatment has included supervised physical therapy, non-steroidal anti-inflammatory medication,
    and a home exercise plan with only partial relief.
  </p>
  <h2>Current request</h2>
  <p>
    We are requesting approval for an image-guided epidural steroid injection to improve pain control and allow the patient to
    continue rehabilitation safely.
  </p>
`;

export const demoPrompts: DemoPrompt[] = [
  {
    id: "draft-letter",
    label: "Draft support letter",
    intent: "Create a cleaner, insurer-ready support letter with a direct recommendation.",
    response:
      "I drafted a concise support letter with a clinical rationale, failed conservative care, and a direct medical necessity recommendation.",
    html: `
      <h1>Medical Necessity Support Letter</h1>
      <p><strong>Re:</strong> Jordan Rivera | DOB 04/14/1986</p>
      <p><strong>Requested service:</strong> Image-guided epidural steroid injection</p>
      <p>
        I am writing to support authorization for the requested procedure based on persistent lumbar radiculopathy that continues to impair
        function despite appropriate conservative management.
      </p>
      <h2>Why this is needed now</h2>
      <ul>
        <li>Persistent radiating pain limiting ambulation and desk tolerance.</li>
        <li>Incomplete response to physical therapy, oral medication, and home exercise program.</li>
        <li>Targeted intervention is expected to improve pain control and participation in rehabilitation.</li>
      </ul>
      <p>
        In my medical judgment, delaying this intervention is likely to prolong pain, reduce function, and increase the risk of care escalation.
      </p>
    `,
  },
  {
    id: "rewrite-payer",
    label: "Rewrite for payer review",
    intent: "Make the draft feel more formal and utilization-review friendly.",
    response:
      "I rewrote the document in utilization-review language and tightened the benefit-risk framing.",
    html: `
      <h1>Payer Review Version</h1>
      <p>
        The requested intervention is being pursued after documented failure of first-line conservative therapy and ongoing objective functional limitation.
      </p>
      <blockquote>
        The goal of treatment is measurable improvement in pain, activity tolerance, and engagement with rehabilitation while avoiding escalation to more invasive care.
      </blockquote>
      <h2>Prior management</h2>
      <ul>
        <li>Structured physical therapy with limited sustained improvement.</li>
        <li>Trial of anti-inflammatory medication and activity modification.</li>
        <li>Persistent symptoms affecting work, sleep, and mobility.</li>
      </ul>
    `,
  },
  {
    id: "soap-note",
    label: "Convert to SOAP note",
    intent: "Turn the current content into a SOAP-style follow-up note.",
    response:
      "I converted the draft into a SOAP note so the right pane can double as a clinical note editor.",
    html: `
      <h1>Follow-Up SOAP Note</h1>
      <h2>Subjective</h2>
      <p>Patient reports persistent low back pain with intermittent radiation into the right leg and reduced tolerance for prolonged sitting.</p>
      <h2>Objective</h2>
      <p>Symptoms remain functionally limiting despite adherence to conservative therapy. Prior imaging supports lumbar nerve root irritation.</p>
      <h2>Assessment</h2>
      <p>Lumbar radiculopathy with incomplete response to non-invasive management.</p>
      <h2>Plan</h2>
      <ol>
        <li>Proceed with authorization request for image-guided epidural steroid injection.</li>
        <li>Continue home exercise program and symptom monitoring.</li>
        <li>Reassess response and functional status after intervention.</li>
      </ol>
    `,
  },
  {
    id: "plain-language",
    label: "Simplify for patient",
    intent: "Create a patient-friendly explanation with lower reading complexity.",
    response:
      "I simplified the language and kept the recommendation clear for patient-facing communication.",
    html: `
      <h1>Plain-Language Summary</h1>
      <p>
        You have ongoing back pain that travels into your leg. We have already tried therapy, medication, and exercises, but the pain is still making it hard to move,
        work, and sleep.
      </p>
      <p>
        The next recommended step is a guided injection to calm the irritated nerve and help you get more benefit from therapy.
      </p>
      <p>
        Our goal is to reduce pain, improve daily function, and avoid more invasive treatment if possible.
      </p>
    `,
  },
];

export const initialMessages: ChatMessage[] = [
  {
    id: "m1",
    role: "assistant",
    content:
      "Loaded a starter letter in the document pane. Pick a demo prompt or type a request to simulate how a future OpenRouter action could update the draft.",
  },
  {
    id: "m2",
    role: "assistant",
    content:
      "Core export is wired for HTML and DOCX. The editor stays local and there is no auth or speech-to-text in this proof of concept.",
  },
];