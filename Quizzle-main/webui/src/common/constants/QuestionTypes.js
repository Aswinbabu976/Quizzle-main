import {faListUl, faToggleOn, faKeyboard, faSort, faSliders} from "@fortawesome/free-solid-svg-icons";

export const QUESTION_TYPES = {
    MULTIPLE_CHOICE: 'multiple-choice',
    TRUE_FALSE: 'true-false',
    TEXT: 'text',
    SEQUENCE: 'sequence',
    SLIDER: 'slider'
};

export const DEFAULT_QUESTION_TYPE = QUESTION_TYPES.MULTIPLE_CHOICE;

import i18n from '@/i18n';

export const QUESTION_TYPE_CONFIG = [
    {type: QUESTION_TYPES.MULTIPLE_CHOICE, icon: faListUl, name: 'questionType.multipleChoice', description: 'questionType.multipleChoiceDesc'},
    {type: QUESTION_TYPES.TRUE_FALSE, icon: faToggleOn, name: 'questionType.trueFalse', description: 'questionType.trueFalseDesc'},
    {type: QUESTION_TYPES.TEXT, icon: faKeyboard, name: 'questionType.text', description: 'questionType.textDesc'},
    {type: QUESTION_TYPES.SEQUENCE, icon: faSort, name: 'questionType.sequence', description: 'questionType.sequenceDesc'},
    {type: QUESTION_TYPES.SLIDER, icon: faSliders, name: 'questionType.slider', description: 'questionType.sliderDesc'}
];
const getQuestionTypeConfig = (type) => QUESTION_TYPE_CONFIG.find(config => config.type === type) || QUESTION_TYPE_CONFIG[0];
export const getQuestionTypeIcon = (type) => getQuestionTypeConfig(type).icon;
export const getQuestionTypeName = (type) => i18n.t(getQuestionTypeConfig(type).name);
export const getQuestionTypeDescription = (type) => i18n.t(getQuestionTypeConfig(type).description);

export const getDefaultAnswersForType = (type) => {
    switch (type) {
        case QUESTION_TYPES.TRUE_FALSE: return [{type: QUESTION_TYPES.TEXT, content: 'True', is_correct: false}, {type: QUESTION_TYPES.TEXT, content: 'False', is_correct: false}];
        case QUESTION_TYPES.TEXT: return [{content: ''}];
        case QUESTION_TYPES.SEQUENCE: return [];
        case QUESTION_TYPES.SLIDER: return [{correctValue: 50, min: 0, max: 100, step: 1, answerMargin: 'medium'}];
        case QUESTION_TYPES.MULTIPLE_CHOICE:
        default: return [];
    }
};

export const ANSWER_LIMITS = {
    [QUESTION_TYPES.MULTIPLE_CHOICE]: 6,
    [QUESTION_TYPES.TRUE_FALSE]: 2,
    [QUESTION_TYPES.TEXT]: 10,
    [QUESTION_TYPES.SEQUENCE]: 8,
    [QUESTION_TYPES.SLIDER]: 1
};

export const MINIMUM_ANSWERS = {
    [QUESTION_TYPES.MULTIPLE_CHOICE]: 2,
    [QUESTION_TYPES.TRUE_FALSE]: 2,
    [QUESTION_TYPES.TEXT]: 1,
    [QUESTION_TYPES.SEQUENCE]: 2,
    [QUESTION_TYPES.SLIDER]: 1
};

export const SLIDER_MARGIN_CONFIG = {
    none: { label: 'None', description: 'Only accept the exact answer', factor: 0 },
    low: { label: 'Low', description: 'Low tolerance for error', factor: 0.05 },
    medium: { label: 'Medium', description: 'Medium tolerance for error', factor: 0.1 },
    high: { label: 'High', description: 'High tolerance for error', factor: 0.2 },
    maximum: { label: 'Maximum', description: 'Next answer gets more points', factor: 0.4 }
};