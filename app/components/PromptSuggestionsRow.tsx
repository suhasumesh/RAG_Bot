import PromptSuggestionButton from "./PromptSuggestionButton"

const PromptSuggestionsRow = ({onPromptClick}) => {
  const prompts = [
    // 🏆 Cricket World Cup
  "Who has won the most Cricket World Cups?",
  "Which country hosted the first Cricket World Cup?",
  "What was special about the 2019 Cricket World Cup final?",
  "How has the format of the Cricket World Cup changed over the years?",
  "Who is the highest run scorer in World Cup history?",

  // 🏏 Men’s T20 World Cup
  "Which country has won the most Men’s T20 World Cups?",
  "Who was the first captain to lift the T20 World Cup?",
  "What are some major upsets in T20 World Cup history?",
  "How is the T20 World Cup different from the ODI World Cup?",
  "Who scored the fastest fifty in T20 World Cup history?",

  // ⚽ Football
  "Who is considered the greatest football player of all time?",
  "What are the major international football tournaments?",
  "How has football evolved as a global sport?",
  "What are the key rules that make football different from rugby?",
  "Which countries have won the FIFA World Cup the most times?",

  // 🌍 International Cricket
  "What is the difference between Test cricket, ODI, and T20?",
  "Who governs international cricket?",
  "What is the significance of the ICC rankings?",
  "Which are the top rivalries in international cricket?",
  "How does international cricket scheduling work?"
  ];
  return (
    <div className="prompt-suggestion-row p-2 m-2">
      {prompts.map((prompt,idx)=>
        <PromptSuggestionButton key={`suggestion-${idx}`} text={prompt} handleOnClick={()=>{onPromptClick(prompt)}}/>
      )}
    </div>
  )
}

export default PromptSuggestionsRow