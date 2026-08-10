import {useContext, useEffect} from "react";
import {postRequest} from "@/common/utils/RequestUtil.js";
import {AuthContext} from "@/common/contexts/Auth";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';

export const ResultsDialog = ({isOpen, onClose, practiceCode, onSuccess}) => {
    const {isAuthenticated, requireAuth} = useContext(AuthContext);
    const { t } = useTranslation();

    useEffect(() => {
        if (!isOpen) return;

        const access = async () => {
            try {
                await postRequest(`/practice/${practiceCode}/results`, {});
                onClose();
                onSuccess(practiceCode);
            } catch (error) {
                if (error.message?.includes('404')) {
                    toast.error(t('home.errors.practiceNotFound'));
                } else if (error.message?.includes('401')) {
                    toast.error(t('quizCreator.errors.loginRequired'));
                } else {
                    toast.error('Error loading results');
                }
            }
        };

        if (isAuthenticated) {
            access();
        } else {
            requireAuth(access);
            onClose();
        }
    }, [isOpen]);

    return null;
};
