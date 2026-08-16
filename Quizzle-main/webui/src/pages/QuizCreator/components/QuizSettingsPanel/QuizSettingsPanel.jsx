import "./styles.sass";
import SelectBox from "@/common/components/SelectBox";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
    faClock,
    faShuffle,
    faCoins,
    faAlignLeft,
    faSignal,
} from "@fortawesome/free-solid-svg-icons";
import {motion} from "framer-motion";
import {DEFAULT_QUIZ_SETTINGS} from "@/common/constants/QuizSettings.js";
import { useTranslation } from "react-i18next";

export const QuizSettingsPanel = ({settings, onChange}) => {
    const s = {...DEFAULT_QUIZ_SETTINGS, ...settings};

    const { t } = useTranslation();

    const update = (key, value) => {
        onChange({...s, [key]: value});
    };

    const difficultyOptions = [
            {value: "none", label: t('quizSettings.difficultyNone'), description: t('quizSettings.difficultyNoneDesc'), icon: faSignal},
            {value: "easy", label: t('quizSettings.difficultyEasy'), description: t('quizSettings.difficultyEasyDesc'), icon: faSignal},
            {value: "medium", label: t('quizSettings.difficultyMedium'), description: t('quizSettings.difficultyMediumDesc'), icon: faSignal},
            {value: "hard", label: t('quizSettings.difficultyHard'), description: t('quizSettings.difficultyHardDesc'), icon: faSignal},
    ];

    const timerOptions = [
            {value: "15", label: t('quizSettings.timer15'), description: t('quizSettings.timer15Desc'), icon: faClock},
            {value: "30", label: t('quizSettings.timer30'), description: t('quizSettings.timer30Desc'), icon: faClock},
            {value: "60", label: t('quizSettings.timer60'), description: t('quizSettings.timer60Desc'), icon: faClock},
            {value: "120", label: t('quizSettings.timer120'), description: t('quizSettings.timer120Desc'), icon: faClock},
            {value: "-1", label: t('quizSettings.timerUnlimited'), description: t('quizSettings.timerUnlimitedDesc'), icon: faClock},
    ];

    const scoringOptions = [
            {value: "time-based", label: t('quizSettings.scoringTimeBased'), description: t('quizSettings.scoringTimeBasedDesc'), icon: faCoins},
            {value: "flat", label: t('quizSettings.scoringFlat'), description: t('quizSettings.scoringFlatDesc'), icon: faCoins},
    ];

    return (
        <motion.div
            className="quiz-settings-panel"
            initial={{opacity: 0, x: -20}}
            animate={{opacity: 1, x: 0}}
            transition={{duration: 0.25, delay: 0.1, ease: "easeOut"}}
        >
            <div className="settings-header">
                <h3>{t('quizSettings.title')}</h3>
            </div>

            <div className="settings-section">
                <div className="section-title">{t('quizSettings.aboutTitle')}</div>

                <div className="setting-group">
                    <div className="setting-label">
                        <FontAwesomeIcon icon={faAlignLeft}/>
                        {t("quizSettings.description")}
                    </div>
                    <textarea
                        className="settings-textarea"
                        placeholder={t("quizSettings.descriptionPlaceholder")}
                        value={s.description}
                        onChange={(e) => update("description", e.target.value)}
                        maxLength={300}
                        rows={3}
                    />
                    <div className="char-count">{s.description.length}/300</div>
                </div>

                <div className="setting-group">
                    <div className="setting-label">
                        <FontAwesomeIcon icon={faSignal}/>
                        {t("quizSettings.difficulty")}
                    </div>
                    <SelectBox
                        value={s.difficulty || "none"}
                        onChange={(v) => update("difficulty", v === "none" ? null : v)}
                        options={difficultyOptions}
                        placeholder={t("quizSettings.difficultyPlaceholder")}
                    />
                </div>
            </div>

            <div className="settings-section">
                <div className="section-title">{t('quizSettings.flowTitle')}</div>

                <div className="setting-group">
                    <div className="setting-label">
                        <FontAwesomeIcon icon={faShuffle}/>
                        {t("quizSettings.shuffleQuestions")}
                    </div>
                    <div className="toggle-row" onClick={() => update("shuffleQuestions", !s.shuffleQuestions)}>
                        <div className={`toggle ${s.shuffleQuestions ? "active" : ""}`}>
                            <div className="toggle-knob"/>
                        </div>
                        <span className="toggle-text">{s.shuffleQuestions ? t('quizSettings.toggleOn') : t('quizSettings.toggleOff')}</span>
                    </div>
                </div>

                <div className="setting-group">
                    <div className="setting-label">
                        <FontAwesomeIcon icon={faShuffle}/>
                        {t("quizSettings.shuffleAnswers")}
                    </div>
                    <div className="toggle-row" onClick={() => update("shuffleAnswers", !s.shuffleAnswers)}>
                        <div className={`toggle ${s.shuffleAnswers ? "active" : ""}`}>
                            <div className="toggle-knob"/>
                        </div>
                        <span className="toggle-text">{s.shuffleAnswers ? t('quizSettings.toggleOn') : t('quizSettings.toggleOff')}</span>
                    </div>
                </div>

                <div className="setting-group">
                    <div className="setting-label">{t("quizSettings.defaultTimer")}
                    </div>
                    <SelectBox
                        value={String(s.defaultTimer)}
                        onChange={(v) => update("defaultTimer", parseInt(v))}
                        options={timerOptions}
                        placeholder={t("quizSettings.timerPlaceholder")}
                    />
                </div>

                <div className="setting-group">
                    <div className="setting-label">
                        <FontAwesomeIcon icon={faCoins}/>
                        {t("quizSettings.scoring")}
                    </div>
                    <SelectBox
                        value={s.scoringMode}
                        onChange={(v) => update("scoringMode", v)}
                        options={scoringOptions}
                        placeholder={t("quizSettings.scoringPlaceholder")}
                    />
                </div>
            </div>
        </motion.div>
    );
};
