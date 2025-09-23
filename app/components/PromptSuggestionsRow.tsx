import PromptSuggestionButton from "./PromptSuggestionButton"

const PromptSuggestionsRow = ({ onPromptClick }) => {
  const prompts = [
    // 🤖 RPA, Agentic AI, Augmented AI
    "What are the key differences between Robotic Process Automation (RPA) and traditional automation?",
    "How does Agentic AI make decisions independently in complex workflows?",
    "What are some practical applications of Augmented AI in business processes?",
    "How can RPA and AI be combined to improve operational efficiency?",
    "What ethical considerations arise when deploying Agentic AI in organizations?"
  ];
  return (
    <div className="prompt-suggestion-row p-2 m-2">
      {prompts.map((prompt, idx) =>
        <PromptSuggestionButton key={`suggestion-${idx}`} text={prompt} handleOnClick={() => { onPromptClick(prompt) }} />
      )}
    </div>
  )
}

export default PromptSuggestionsRow