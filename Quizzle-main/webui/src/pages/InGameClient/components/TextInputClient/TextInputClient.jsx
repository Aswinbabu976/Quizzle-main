import "./styles.sass";
import {useState} from "react";
import { useTranslation } from 'react-i18next';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faPaperPlane} from "@fortawesome/free-solid-svg-icons";

export const TextInputClient = ({onSubmit, maxLength = 200}) => {
    const [textAnswer, setTextAnswer] = useState("");
    const { t } = useTranslation();

    const handleSubmit = () => {
        if (textAnswer.trim() !== "") {
            onSubmit(textAnswer.trim());
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="text-input-client">
            <div className="text-input-container">
                <textarea
                    value={textAnswer}
                    onChange={(e) => setTextAnswer(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('inGame.textInput.placeholder')}
                    maxLength={maxLength}
                    className="text-answer-input"
                    aria-label={t('inGame.textInput.ariaInput')}
                />
                <div className="character-count" aria-live="polite">
                    {textAnswer.length}/{maxLength}
                </div>
            </div>
            <button 
                type="button"
                onClick={handleSubmit}
                disabled={textAnswer.trim() === ""}
                className={`submit-text-answer ${textAnswer.trim() !== "" ? "submit-shown" : ""}`}
                aria-label={t('inGame.textInput.ariaSubmit')}
            >
                <FontAwesomeIcon icon={faPaperPlane} aria-hidden="true" />
            </button>
        </div>
    );
};