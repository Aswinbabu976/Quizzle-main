import "./styles.sass";
import Input from "@/common/components/Input";
import { useTranslation } from 'react-i18next';
import Button from "@/common/components/Button";
import {faClone, faTrash} from "@fortawesome/free-solid-svg-icons";
import ImagePresenter from "@/pages/QuizCreator/components/QuestionEditor/components/ImagePresenter";
import AnswerContainer from "@/pages/QuizCreator/components/QuestionEditor/components/AnswerContainer";
import {motion, AnimatePresence} from "framer-motion";
import {useState, useRef, useEffect} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {QUESTION_TYPE_CONFIG, getQuestionTypeIcon, getQuestionTypeName, getDefaultAnswersForType, DEFAULT_QUESTION_TYPE} from "@/common/constants/QuestionTypes.js";
import { useTranslation } from 'react-i18next';

export const QuestionEditor = ({question, onChange, onCommit, deleteQuestion, duplicateQuestion}) => {
    const { t } = useTranslation();
    const [showTypeSelector, setShowTypeSelector] = useState(false);
    const popoverRef = useRef(null);
    
    const updateTitle = (title) => onChange({...question, title: title});
    const updateType = (type) => {
        const commit = onCommit || onChange;
        const newAnswers = getDefaultAnswersForType(type);
        if (newAnswers.length === 0) {
            commit({...question, type: type});
        } else {
            commit({...question, type: type, answers: newAnswers});
        }
        setShowTypeSelector(false);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target)) setShowTypeSelector(false);
        };
        if (showTypeSelector) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showTypeSelector]);

    if (!question) return null;
    const questionType = question.type || DEFAULT_QUESTION_TYPE;

    const { t } = useTranslation();
    const getTypeIcon = (type) => getQuestionTypeIcon(type);
    const getTypeName = (type) => {
        // map types to i18n keys
        const map = {
            'multiple-choice': 'questionType.multipleChoice',
            'true-false': 'questionType.trueFalse',
            'text': 'questionType.text',
            'sequence': 'questionType.sequence',
            'slider': 'questionType.slider'
        };
        return t(map[type] || map[DEFAULT_QUESTION_TYPE]);
    };
    const getTypeDescription = (type) => {
        const map = {
            'multiple-choice': 'questionType.multipleChoiceDesc',
            'true-false': 'questionType.trueFalseDesc',
            'text': 'questionType.textDesc',
            'sequence': 'questionType.sequenceDesc',
            'slider': 'questionType.sliderDesc'
        };
        return t(map[type] || map[DEFAULT_QUESTION_TYPE]);
    };

    return (
        <motion.div className="question-editor" initial={{x: -300, opacity: 0}} animate={{x: 0, opacity: 1}}>
            <div className="question-action-area">
<<<<<<< Updated upstream
                <Input placeholder={t('quizCreator.questionEditor.placeholderTitle')} value={question.title} onChange={(e) => updateTitle(e.target.value)}
=======
                <Input placeholder={t('quizCreator.questionTitlePlaceholder')} value={question.title} onChange={(e) => updateTitle(e.target.value)}
>>>>>>> Stashed changes
                          textAlign="center"/>
                
                <div className="question-type-selector-container" ref={popoverRef}>
                    <button 
                        className="question-type-button" 
                        onClick={() => setShowTypeSelector(!showTypeSelector)}
                        type="button"
                    >
                        <FontAwesomeIcon icon={getTypeIcon(questionType)} />
                        <span>{getTypeName(questionType)}</span>
                    </button>
                    
                    <AnimatePresence>
                        {showTypeSelector && (
                            <motion.div 
                                className="type-selector-popover"
                                initial={{opacity: 0, y: -10, scale: 0.95}}
                                animate={{opacity: 1, y: 0, scale: 1}}
                                exit={{opacity: 0, y: -10, scale: 0.95}}
                                transition={{duration: 0.2}}
                            >
                                {QUESTION_TYPE_CONFIG.map((typeOption) => (
                                    <div 
                                        key={typeOption.type}
                                        className={`type-option ${questionType === typeOption.type ? 'active' : ''}`}
                                        onClick={() => updateType(typeOption.type)}
                                    >
                                        <div className="type-option-header">
                                            <FontAwesomeIcon icon={typeOption.icon} />
                                            <span className="type-name">{getTypeName(typeOption.type)}</span>
                                        </div>
                                        <p className="type-description">{getTypeDescription(typeOption.type)}</p>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                
                <Button icon={faClone} type="green" onClick={() => duplicateQuestion(question.uuid)} padding="0.8rem 0.8rem"/>
                <Button icon={faTrash} type="red" onClick={() => deleteQuestion(question.uuid)} padding="0.8rem 0.8rem"/>
            </div>

            <ImagePresenter question={question} onChange={onChange}/>

            <AnswerContainer question={question} onChange={onChange} />
        </motion.div>
    )
}