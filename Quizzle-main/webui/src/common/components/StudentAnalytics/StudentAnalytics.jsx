import React, {useState} from 'react';
import {getCharacterEmoji} from '@/common/data/characters';
import {useTranslation} from 'react-i18next';
import './styles.sass';

const StudentAnalytics = ({analyticsData, isLiveQuiz}) => {
    const { t } = useTranslation();
    const {studentAnalytics} = analyticsData;
    const [sortBy, setSortBy] = useState(isLiveQuiz ? 'totalPoints' : 'accuracy');

    const sorted = [...studentAnalytics].sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));

    const accuracyLevel = (acc) => acc >= 80 ? 'green' : acc >= 60 ? 'orange' : 'red';

    return (
        <div className="student-analytics">
            <div className="sa-toolbar">
                <button className={sortBy === 'accuracy' ? 'active' : ''} onClick={() => setSortBy('accuracy')}>{t('analytics.sortByAccuracy')}</button>
                <button className={sortBy === 'correctAnswers' ? 'active' : ''} onClick={() => setSortBy('correctAnswers')}>{t('analytics.sortByCorrect')}</button>
                {isLiveQuiz && (
                    <button className={sortBy === 'totalPoints' ? 'active' : ''} onClick={() => setSortBy('totalPoints')}>{t('analytics.sortByPoints')}</button>
                )}
            </div>

            <div className="sa-list">
                {sorted.map((student, idx) => {
                    const level = accuracyLevel(student.accuracy);
                    return (
                        <div key={student.id} className="sa-row">
                            <div className="sa-rank">{idx + 1}</div>
                            <div className="sa-character">{getCharacterEmoji(student.character)}</div>
                            <div className="sa-name">{student.name}</div>

                            <div className="sa-bar-wrap">
                                <div className="sa-bar">
                                    <div className={`sa-bar-fill ${level}`} style={{width: `${student.accuracy}%`}}/>
                                </div>
                                <div className={`sa-accuracy ${level}`}>{student.accuracy}%</div>
                            </div>

                            <div className="sa-counts">
                                <span className="correct">{student.correctAnswers}</span>
                                <span className="sep">/</span>
                                <span className="incorrect">{student.incorrectAnswers}</span>
                            </div>

                            {isLiveQuiz && (
                                <div className="sa-points">{student.totalPoints?.toLocaleString?.() ?? student.totalPoints}</div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StudentAnalytics;