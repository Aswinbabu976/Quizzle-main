import "./styles.sass";
import { useTranslation } from 'react-i18next';

export const AnswerContent = ({answer, index, className = "answer-content"}) => {
    const { t } = useTranslation();
    if (answer.type === "image") {
        return (
            <img
                src={answer.content}
                alt={t('common.answerAlt', { index: index + 1 })}
                className={`${className}-image`}
            />
        );
    }
    return (
        <span className={`${className}-text`}>
            {answer.content}
        </span>
    );
};
