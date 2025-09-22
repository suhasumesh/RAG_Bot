import 'bootstrap/dist/css/bootstrap.min.css';
const PromptSuggestionButton = ({text,handleOnClick}) => {
  return (
    <button className='btn btn-primary rounded-pill px-4 m-2 p-2' onClick={handleOnClick}>{text}</button>
  )
}

export default PromptSuggestionButton