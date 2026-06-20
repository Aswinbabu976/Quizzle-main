import {useState, useContext} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faRightToBracket} from '@fortawesome/free-solid-svg-icons';
import Dialog from '@/common/components/Dialog';
import Input from '@/common/components/Input';
import {AuthContext} from '@/common/contexts/Auth';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import './styles.sass';

export const LoginDialog = ({isOpen, onClose, onSuccess}) => {
    const {login} = useContext(AuthContext);
    const { t } = useTranslation();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!username.trim()) {
            setError(t('loginDialog.errors.usernameRequired'));
            return;
        }
        if (!password) {
            setError(t('loginDialog.errors.passwordRequired'));
            return;
        }
        setLoading(true);
        setError('');
        try {
            await login(username.trim(), password);
            toast.success(t('loginDialog.success'));
            setUsername('');
            setPassword('');
            setError('');
            onSuccess?.();
        } catch (err) {
            setError(err.message || t('loginDialog.errors.loginFailed'));
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setUsername('');
        setPassword('');
        setError('');
        onClose();
    };

    return (
        <Dialog
            isOpen={isOpen}
            onClose={handleClose}
            onConfirm={handleConfirm}
            onCancel={handleClose}
            title={
                <div className="login-dialog-title">
                    <FontAwesomeIcon icon={faRightToBracket} className="login-dialog-title-icon"/>
                    {t('loginDialog.title')}
                </div>
            }
            confirmText={loading ? "..." : t('loginDialog.title')}
            cancelText={t('loginDialog.cancel')}
            className="login-dialog"
        >
            <div className="login-dialog-content">
                <p className="login-dialog-text">
                    {t('loginDialog.description')} <strong>{t('loginDialog.account')}</strong> {t('loginDialog.descriptionEnd')}
                </p>
                <div className="login-input-wrapper">
                    <Input
                        placeholder={t('loginDialog.usernamePlaceholder')}
                        value={username}
                        onChange={(e) => {setUsername(e.target.value); setError('');}}
                        onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                    />
                    <Input
                        type="password"
                        placeholder={t('loginDialog.passwordPlaceholder')}
                        value={password}
                        onChange={(e) => {setPassword(e.target.value); setError('');}}
                        error={error}
                        onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                    />
                </div>
            </div>
        </Dialog>
    );
};