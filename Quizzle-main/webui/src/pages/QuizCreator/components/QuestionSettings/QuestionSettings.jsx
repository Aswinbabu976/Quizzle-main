import "./styles.sass";
import SelectBox from "@/common/components/SelectBox";
<<<<<<< Updated upstream
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faInfinity, faCoins, faSliders } from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { QUESTION_TYPES, SLIDER_MARGIN_CONFIG } from "@/common/constants/QuestionTypes.js";
import { useTranslation } from 'react-i18next';

export const QuestionSettings = ({ question, onChange, onCommit, defaultTimer = 60 }) => {
    const { t } = useTranslation();

=======
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faClock, faInfinity, faCoins, faSliders} from "@fortawesome/free-solid-svg-icons";
import {useState, useEffect} from "react";
import {motion} from "framer-motion";
import {QUESTION_TYPES, SLIDER_MARGIN_CONFIG} from "@/common/constants/QuestionTypes.js";
import { useTranslation } from 'react-i18next';

export const QuestionSettings = ({question, onChange, onCommit, defaultTimer = 60}) => {
    const { t } = useTranslation();

>>>>>>> Stashed changes
    const [selectedTimer, setSelectedTimer] = useState(() => {
        if (question.timer === undefined || question.timer === null) return "default";
        if (question.timer === -1) return "unlimited";
        if (question.timer === 30) return "30";
        if (question.timer === 120) return "120";
        return "custom";
    });

    const [selectedPointMultiplier, setSelectedPointMultiplier] = useState(() => {
        if (question.pointMultiplier === undefined || question.pointMultiplier === null) return "standard";
        return question.pointMultiplier;
    });

<<<<<<< Updated upstream
    const defaultTimerLabel = defaultTimer === -1 ? t('quizCreator.settings.unlimited') : `${defaultTimer}s`;

    const timerOptions = [
        {
            value: "default",
            label: `${t('quizCreator.settings.standard')} (${defaultTimerLabel})`,
            description: t('quizCreator.settings.fromQuizSettings'),
            icon: faClock
        },
        {
            value: "30",
            label: `30 ${t('quizCreator.settings.seconds')}`,
            description: t('quizCreator.settings.quickQuestions'),
            icon: faClock
        },
        {
            value: "60",
            label: `60 ${t('quizCreator.settings.seconds')}`,
            description: t('quizCreator.settings.oneMinutePerQuestion'),
            icon: faClock
        },
        {
            value: "120",
            label: `2 ${t('quizCreator.settings.minutes')}`,
            description: t('quizCreator.settings.moreTime'),
            icon: faClock
        },
        {
            value: "unlimited",
            label: t('quizCreator.settings.unlimited'),
            description: t('quizCreator.settings.noTimeLimit'),
            icon: faInfinity
        }
    ];

    const pointMultiplierOptions = [
        {
            value: "standard",
            label: t('quizCreator.settings.standard'),
            description: t('quizCreator.settings.normalPoints'),
            icon: faCoins
        },
        {
            value: "none",
            label: t('quizCreator.settings.noPoints'),
            description: t('quizCreator.settings.noPointsDesc'),
            icon: faCoins
        },
        {
            value: "double",
            label: t('quizCreator.settings.doublePoints'),
            description: t('quizCreator.settings.doublePointsDesc'),
            icon: faCoins
        }
=======
    const defaultTimerLabel = defaultTimer === -1 ? t('quizCreator.unlimited') : `${defaultTimer}s`;

    const timerOptions = [
        { value: "default", label: `${t('quizCreator.standard')} (${defaultTimerLabel})`, description: t('quizCreator.fromQuizSettings'), icon: faClock },
        { value: "30", label: t('quizCreator.30seconds'), description: t('quizCreator.quickQuestions'), icon: faClock },
        { value: "60", label: t('quizCreator.60seconds'), description: t('quizCreator.oneMinute'), icon: faClock },
        { value: "120", label: t('quizCreator.2minutes'), description: t('quizCreator.moreTime'), icon: faClock },
        { value: "unlimited", label: t('quizCreator.unlimited'), description: t('quizCreator.noTimeLimit'), icon: faInfinity }
    ];

    const pointMultiplierOptions = [
        { value: "standard", label: t('quizCreator.standard'), description: t('quizCreator.normalPoints'), icon: faCoins },
        { value: "none", label: t('quizCreator.noPoints'), description: t('quizCreator.noPointsDesc'), icon: faCoins },
        { value: "double", label: t('quizCreator.doublePoints'), description: t('quizCreator.doublePointsDesc'), icon: faCoins }
>>>>>>> Stashed changes
    ];

    useEffect(() => {
        if (question.timer === undefined || question.timer === null) setSelectedTimer("default");
        else if (question.timer === -1) setSelectedTimer("unlimited");
        else if (question.timer === 30) setSelectedTimer("30");
        else if (question.timer === 120) setSelectedTimer("120");
        else setSelectedTimer("custom");

        if (question.pointMultiplier === undefined || question.pointMultiplier === null) setSelectedPointMultiplier("standard");
        else setSelectedPointMultiplier(question.pointMultiplier);
    }, [question.timer, question.pointMultiplier]);

    const handleTimerChange = (value) => {
        setSelectedTimer(value);
        const commit = onCommit || onChange;
        let timerNum;
<<<<<<< Updated upstream
        if (value === "default") {
            timerNum = undefined;
        } else if (value === "unlimited") {
            timerNum = -1;
        } else if (value === "30") {
            timerNum = 30;
        } else if (value === "120") {
            timerNum = 120;
        }

        commit({ ...question, timer: timerNum });
=======
        if (value === "default") timerNum = undefined;
        else if (value === "unlimited") timerNum = -1;
        else if (value === "30") timerNum = 30;
        else if (value === "120") timerNum = 120;
        commit({...question, timer: timerNum});
>>>>>>> Stashed changes
    };

    const handlePointMultiplierChange = (value) => {
        setSelectedPointMultiplier(value);
        const commit = onCommit || onChange;
        const multiplierValue = value === "standard" ? undefined : value;
        commit({ ...question, pointMultiplier: multiplierValue });
    };

    const handleAnswerMarginChange = (value) => {
        const commit = onCommit || onChange;
        const answers = question.answers || [{ correctValue: 50, min: 0, max: 100, step: 1, answerMargin: 'medium' }];
        const updatedAnswers = [{ ...answers[0], answerMargin: value }];
        commit({ ...question, answers: updatedAnswers });
    };

    const answerMarginOptions = Object.entries(SLIDER_MARGIN_CONFIG).map(([key, config]) => ({
        value: key,
        label: t(`quizCreator.settings.slider.${key}.label`, { defaultValue: config.label }),
        description: t(`quizCreator.settings.slider.${key}.desc`, { defaultValue: config.description }),
        icon: faSliders
    }));

    const isSliderType = question?.type === QUESTION_TYPES.SLIDER;
    const currentAnswerMargin = question?.answers?.[0]?.answerMargin || 'medium';

    if (!question) return null;

    return (
<<<<<<< Updated upstream
        <motion.div
            className="question-settings"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: 0.2, ease: "easeOut" }}
        >
            <div className="settings-header">
                <h3>{t('quizCreator.settings.title')}</h3>
=======
        <motion.div className="question-settings" initial={{opacity: 0, x: -20}} animate={{opacity: 1, x: 0}} transition={{duration: 0.25, delay: 0.2, ease: "easeOut"}}>
            <div className="settings-header">
                <h3>{t('quizCreator.questionSettings')}</h3>
>>>>>>> Stashed changes
            </div>

            <div className="setting-group">
                <div className="setting-label">
<<<<<<< Updated upstream
                    <FontAwesomeIcon icon={faClock} />
                    {t('quizCreator.settings.timeLimit')}
                </div>

                <SelectBox value={selectedTimer} onChange={handleTimerChange} options={timerOptions} placeholder={t("quizCreator.settings.timerPlaceholder")} />
=======
                    <FontAwesomeIcon icon={faClock}/>
                    <span>{t('quizCreator.timeLimit')}</span>
                </div>
                <SelectBox value={selectedTimer} onChange={handleTimerChange} options={timerOptions} placeholder={t('quizCreator.selectTimer')}/>
>>>>>>> Stashed changes
            </div>

            <div className="setting-group">
                <div className="setting-label">
<<<<<<< Updated upstream
                    <FontAwesomeIcon icon={faCoins} />
                    {t('quizCreator.settings.pointDistribution')}
                </div>

                <SelectBox value={selectedPointMultiplier} onChange={handlePointMultiplierChange} options={pointMultiplierOptions} placeholder={t("quizCreator.settings.pointPlaceholder")} />
=======
                    <FontAwesomeIcon icon={faCoins}/>
                    <span>{t('quizCreator.pointDistribution')}</span>
                </div>
                <SelectBox value={selectedPointMultiplier} onChange={handlePointMultiplierChange} options={pointMultiplierOptions} placeholder={t('quizCreator.selectPoints')}/>
>>>>>>> Stashed changes
            </div>

            {isSliderType && (
                <div className="setting-group">
                    <div className="setting-label">
<<<<<<< Updated upstream
                        <FontAwesomeIcon icon={faSliders} />
                        {t('quizCreator.settings.answerMargin')}
                    </div>

                    <SelectBox value={currentAnswerMargin} onChange={handleAnswerMarginChange} options={answerMarginOptions} placeholder={t("quizCreator.settings.answerMarginPlaceholder")} />
=======
                        <FontAwesomeIcon icon={faSliders}/>
                        <span>{t('quizCreator.answerMargin')}</span>
                    </div>
                    <SelectBox value={currentAnswerMargin} onChange={handleAnswerMarginChange} options={answerMarginOptions} placeholder={t('quizCreator.selectMargin')}/>
>>>>>>> Stashed changes
                </div>
            )}
        </motion.div>
    );
};