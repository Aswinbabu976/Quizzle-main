import {useContext, useEffect, useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {AuthContext} from "@/common/contexts/Auth";
import {BrandingContext} from "@/common/contexts/Branding";
import {jsonRequest, postRequest, putRequest, deleteRequest} from "@/common/utils/RequestUtil.js";
import Button from "@/common/components/Button";
import Input from "@/common/components/Input";
import SelectBox from "@/common/components/SelectBox";
import Dialog from "@/common/components/Dialog";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
    faUsers, faRobot, faPalette, faPlus, faTrash,
    faShieldAlt, faChalkboardTeacher, faKey, faRightFromBracket, faUpload, faRotateLeft, faImage
} from "@fortawesome/free-solid-svg-icons";
import {motion} from "framer-motion";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';
import "./styles.sass";

const AI_PROVIDERS = (t) => [
    {value: '', label: t('admin.providers.disabled')},
    {value: 'openai', label: 'OpenAI'},
    {value: 'anthropic', label: 'Anthropic'},
    {value: 'google', label: 'Google'},
    {value: 'ollama', label: 'Ollama'}
];

export const Admin = () => {
    const {user, isAdmin, logout} = useContext(AuthContext);
    const {titleImg, logoImg, refreshBranding} = useContext(BrandingContext);
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [activeTab, setActiveTab] = useState('ai');
    const [settings, setSettings] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [aiProvider, setAiProvider] = useState('');
    const [aiApiKey, setAiApiKey] = useState('');
    const [aiModel, setAiModel] = useState('');
    const [aiBaseUrl, setAiBaseUrl] = useState('');
    const [aiModels, setAiModels] = useState([]);
    const [modelsLoading, setModelsLoading] = useState(false);

    const [unsplashAccessKey, setUnsplashAccessKey] = useState('');
    const [giphyApiKey, setGiphyApiKey] = useState('');

    const [brandName, setBrandName] = useState('');
    const [brandColor, setBrandColor] = useState('');
    const [brandImprint, setBrandImprint] = useState('');
    const [brandPrivacy, setBrandPrivacy] = useState('');

    const [logoPreview, setLogoPreview] = useState(null);
    const [titlePreview, setTitlePreview] = useState(null);

    const [showNewUserDialog, setShowNewUserDialog] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState('teacher');
    const [newUserError, setNewUserError] = useState('');

    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const [passwordResetUserId, setPasswordResetUserId] = useState(null);
    const [newPasswordValue, setNewPasswordValue] = useState('');

    useEffect(() => {
        if (!isAdmin) {
            navigate('/');
            return;
        }
        loadSettings();
        loadUsers();
    }, [isAdmin, navigate]);

    useEffect(() => {
        if (!aiProvider) {
            setAiModels([]);
            return;
        }
        fetchModels(aiProvider, aiApiKey, aiBaseUrl);
    }, [aiProvider, aiApiKey, aiBaseUrl]);

    const fetchModels = async (provider, apiKey, baseUrl) => {
        setModelsLoading(true);
        try {
            const data = await postRequest('/admin/models', {provider, apiKey, baseUrl});
            setAiModels((data.models || []).map(m => ({value: m, label: m})));
        } catch {
            setAiModels([]);
        } finally {
            setModelsLoading(false);
        }
    };

    const loadSettings = async () => {
        try {
            const data = await jsonRequest('/admin/settings');
            setSettings(data);
            setAiProvider(data.config?.ai?.provider || '');
            setAiApiKey(data.config?.ai?.apiKey || '');
            setAiModel(data.config?.ai?.model || '');
            setAiBaseUrl(data.config?.ai?.baseUrl || '');
            setUnsplashAccessKey(data.config?.media?.unsplashAccessKey || '');
            setGiphyApiKey(data.config?.media?.giphyApiKey || '');
            setBrandName(data.branding?.name || '');
            setBrandColor(data.branding?.color || '');
            setBrandImprint(data.branding?.imprint || '');
            setBrandPrivacy(data.branding?.privacy || '');
        } catch (error) {
            toast.error(t('admin.errors.settingsLoadFailed'));
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        try {
            const data = await jsonRequest('/admin/users');
            setUsers(data.users || []);
        } catch (error) {
            toast.error(t('admin.errors.usersLoadFailed'));
        }
    };

    const saveAiSettings = async () => {
        try {
            await putRequest('/admin/settings', {
                config: {ai: {provider: aiProvider, apiKey: aiApiKey, model: aiModel, baseUrl: aiBaseUrl}}
            });
            toast.success(t('admin.success.aiSaved'));
        } catch (error) {
            toast.error(error.message || t('admin.errors.saveFailed'));
        }
    };

    const saveMediaSettings = async () => {
        try {
            await putRequest('/admin/settings', {
                config: {media: {unsplashAccessKey, giphyApiKey}}
            });
            toast.success(t('admin.success.mediaSaved'));
        } catch (error) {
            toast.error(error.message || t('admin.errors.saveFailed'));
        }
    };

    const saveBrandingSettings = async () => {
        try {
            await putRequest('/admin/settings', {
                branding: {name: brandName, color: brandColor, imprint: brandImprint, privacy: brandPrivacy}
            });
            toast.success(t('admin.success.brandingSaved'));
        } catch (error) {
            toast.error(error.message || t('admin.errors.saveFailed'));
        }
    };

    const handleImageSelect = (type, e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast.error(t('admin.errors.imageTooLarge'));
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            if (type === 'logo') setLogoPreview(reader.result);
            else setTitlePreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const uploadImage = async (type) => {
        const image = type === 'logo' ? logoPreview : titlePreview;
        if (!image) return;
        try {
            await putRequest(`/admin/branding/${type}`, {image});
            toast.success(type === 'logo' ? t('admin.success.logoUploaded') : t('admin.success.bannerUploaded'));
            if (type === 'logo') setLogoPreview(null);
            else setTitlePreview(null);
            refreshBranding?.();
        } catch (error) {
            toast.error(error.message || t('admin.errors.uploadFailed'));
        }
    };

    const resetImage = async (type) => {
        try {
            await deleteRequest(`/admin/branding/${type}`);
            toast.success(type === 'logo' ? t('admin.success.logoReset') : t('admin.success.bannerReset'));
            if (type === 'logo') setLogoPreview(null);
            else setTitlePreview(null);
            refreshBranding?.();
        } catch (error) {
            toast.error(error.message || t('admin.errors.resetFailed'));
        }
    };

    const createUser = async () => {
        if (!newUsername.trim() || !newPassword) {
            setNewUserError(t('admin.errors.allFieldsRequired'));
            return;
        }
        try {
            await postRequest('/admin/users', {
                username: newUsername.trim(),
                password: newPassword,
                role: newRole
            });
            toast.success(t('admin.success.userCreated'));
            setShowNewUserDialog(false);
            setNewUsername('');
            setNewPassword('');
            setNewRole('teacher');
            setNewUserError('');
            loadUsers();
        } catch (error) {
            setNewUserError(error.message || t('admin.errors.createFailed'));
        }
    };

    const deleteUserHandler = async (userId, username) => {
        if (!confirm(`${t('admin.confirm.deleteUser')} "${username}"?`)) return;
        try {
            await deleteRequest(`/admin/users/${userId}`);
            toast.success(t('admin.success.userDeleted'));
            loadUsers();
        } catch (error) {
            toast.error(error.message || t('admin.errors.deleteFailed'));
        }
    };

    const toggleRole = async (userId, currentRole) => {
        const newRole = currentRole === 'admin' ? 'teacher' : 'admin';
        try {
            await putRequest(`/admin/users/${userId}/role`, {role: newRole});
            toast.success(t('admin.success.roleUpdated'));
            loadUsers();
        } catch (error) {
            toast.error(error.message || t('admin.errors.updateFailed'));
        }
    };

    const resetPassword = async () => {
        if (!newPasswordValue || newPasswordValue.length < 6) {
            toast.error(t('admin.errors.passwordTooShort'));
            return;
        }
        try {
            await putRequest(`/admin/users/${passwordResetUserId}/password`, {password: newPasswordValue});
            toast.success(t('admin.success.passwordReset'));
            setShowPasswordDialog(false);
            setPasswordResetUserId(null);
            setNewPasswordValue('');
        } catch (error) {
            toast.error(error.message || t('admin.errors.resetFailed'));
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    if (loading) return null;

    return (
        <div className="admin-page">
            <motion.div className="admin-header" initial={{opacity: 0, y: -20}} animate={{opacity: 1, y: 0}}>
                <Link to="/"><img src={titleImg} alt="logo" className="admin-logo"/></Link>
                <div className="admin-header-right">
                    <span className="admin-user-info">
                        <FontAwesomeIcon icon={faShieldAlt}/>
                        {user?.username}
                    </span>
                    <Button text={t('admin.logout')} icon={faRightFromBracket} type="secondary compact" onClick={handleLogout}/>
                </div>
            </motion.div>

            <motion.div className="admin-content" initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.1}}>
                <div className="admin-sidebar">
                    <button className={`sidebar-item ${activeTab === 'ai' ? 'active' : ''}`} onClick={() => setActiveTab('ai')}>
                        <FontAwesomeIcon icon={faRobot}/> {t('admin.aiConfig')}
                    </button>
                    <button className={`sidebar-item ${activeTab === 'media' ? 'active' : ''}`} onClick={() => setActiveTab('media')}>
                        <FontAwesomeIcon icon={faImage}/> {t('admin.media')}
                    </button>
                    <button className={`sidebar-item ${activeTab === 'branding' ? 'active' : ''}`} onClick={() => setActiveTab('branding')}>
                        <FontAwesomeIcon icon={faPalette}/> {t('admin.branding')}
                    </button>
                    <button className={`sidebar-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
                        <FontAwesomeIcon icon={faUsers}/> {t('admin.users')}
                    </button>
                </div>

                <div className="admin-panel">
                    {activeTab === 'ai' && (
                        <motion.div className="settings-section" initial={{opacity: 0}} animate={{opacity: 1}}>
                            <h2><FontAwesomeIcon icon={faRobot}/> {t('admin.aiConfig')}</h2>
                            <p className="section-description">{t('admin.aiConfigDesc')}</p>
                            <div className="settings-form">
                                <div className="form-group">
                                    <label>{t('admin.provider')}</label>
                                    <SelectBox value={aiProvider} onChange={setAiProvider} options={AI_PROVIDERS(t)} placeholder={t('admin.providerPlaceholder')}/>
                                </div>
                                {aiProvider && (
                                    <>
                                        {aiProvider !== 'ollama' && (
                                            <div className="form-group">
                                                <label>{t('admin.apiKey')}</label>
                                                <Input placeholder="sk-..." value={aiApiKey} onChange={(e) => setAiApiKey(e.target.value)}/>
                                            </div>
                                        )}
                                        <div className="form-group">
                                            <label>{t('admin.model')}</label>
                                            <SelectBox
                                                value={aiModel}
                                                onChange={setAiModel}
                                                options={aiModels}
                                                placeholder={modelsLoading ? t('admin.modelLoading') : t('admin.modelPlaceholder')}
                                                disabled={modelsLoading}
                                            />
                                        </div>
                                        {aiProvider === 'ollama' && (
                                            <div className="form-group">
                                                <label>{t('admin.baseUrl')}</label>
                                                <Input placeholder="http://localhost:11434" value={aiBaseUrl} onChange={(e) => setAiBaseUrl(e.target.value)}/>
                                            </div>
                                        )}
                                    </>
                                )}
                                <Button text={t('admin.save')} type="green compact" onClick={saveAiSettings}/>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'media' && (
                        <motion.div className="settings-section" initial={{opacity: 0}} animate={{opacity: 1}}>
                            <h2><FontAwesomeIcon icon={faImage}/> {t('admin.media')}</h2>
                            <p className="section-description">{t('admin.mediaDesc')}</p>
                            <div className="settings-form">
                                <div className="form-group">
                                    <label>Unsplash Access Key</label>
                                    <span className="form-hint">{t('admin.unsplashHint')}</span>
                                    <Input placeholder="e.g. ab12cd34ef56gh78ij90..." value={unsplashAccessKey} onChange={(e) => setUnsplashAccessKey(e.target.value)}/>
                                </div>
                                <div className="form-group">
                                    <label>Giphy API Key</label>
                                    <span className="form-hint">{t('admin.giphyHint')}</span>
                                    <Input placeholder="e.g. aBcDeFgHiJkLmNoPqRsT..." value={giphyApiKey} onChange={(e) => setGiphyApiKey(e.target.value)}/>
                                </div>
                                <Button text={t('admin.save')} type="green compact" onClick={saveMediaSettings}/>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'branding' && (
                        <motion.div className="settings-section" initial={{opacity: 0}} animate={{opacity: 1}}>
                            <h2><FontAwesomeIcon icon={faPalette}/> {t('admin.branding')}</h2>
                            <p className="section-description">{t('admin.brandingDesc')}</p>
                            <div className="settings-form">
                                <div className="form-group">
                                    <label>{t('admin.logo')}</label>
                                    <div className="image-upload-area">
                                        <img src={logoPreview || logoImg} alt="Logo" className="image-preview logo-preview"/>
                                        <div className="image-upload-actions">
                                            <label className="upload-btn">
                                                <FontAwesomeIcon icon={faUpload}/> {t('admin.chooseImage')}
                                                <input type="file" accept="image/*" hidden onChange={(e) => handleImageSelect('logo', e)}/>
                                            </label>
                                            {logoPreview && <Button text={t('admin.upload')} type="green compact" onClick={() => uploadImage('logo')}/>}
                                            {!logoPreview && <button className="reset-btn" onClick={() => resetImage('logo')}><FontAwesomeIcon icon={faRotateLeft}/> {t('admin.reset')}</button>}
                                        </div>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>{t('admin.banner')}</label>
                                    <div className="image-upload-area">
                                        <img src={titlePreview || titleImg} alt="Banner" className="image-preview title-preview"/>
                                        <div className="image-upload-actions">
                                            <label className="upload-btn">
                                                <FontAwesomeIcon icon={faUpload}/> {t('admin.chooseImage')}
                                                <input type="file" accept="image/*" hidden onChange={(e) => handleImageSelect('title', e)}/>
                                            </label>
                                            {titlePreview && <Button text={t('admin.upload')} type="green compact" onClick={() => uploadImage('title')}/>}
                                            {!titlePreview && <button className="reset-btn" onClick={() => resetImage('title')}><FontAwesomeIcon icon={faRotateLeft}/> {t('admin.reset')}</button>}
                                        </div>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>{t('admin.name')}</label>
                                    <Input placeholder="Quizzle" value={brandName} onChange={(e) => setBrandName(e.target.value)}/>
                                </div>
                                <div className="form-group">
                                    <label>{t('admin.primaryColor')}</label>
                                    <div className="color-input-row">
                                        <input type="color" value={brandColor || '#6547EE'} onChange={(e) => setBrandColor(e.target.value)} className="color-picker"/>
                                        <Input placeholder="#6547EE" value={brandColor} onChange={(e) => setBrandColor(e.target.value)}/>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>{t('admin.imprintUrl')}</label>
                                    <Input placeholder="https://..." value={brandImprint} onChange={(e) => setBrandImprint(e.target.value)}/>
                                </div>
                                <div className="form-group">
                                    <label>{t('admin.privacyUrl')}</label>
                                    <Input placeholder="https://..." value={brandPrivacy} onChange={(e) => setBrandPrivacy(e.target.value)}/>
                                </div>
                                <Button text={t('admin.save')} type="green compact" onClick={saveBrandingSettings}/>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'users' && (
                        <motion.div className="settings-section" initial={{opacity: 0}} animate={{opacity: 1}}>
                            <div className="section-header-row">
                                <div>
                                    <h2><FontAwesomeIcon icon={faUsers}/> {t('admin.users')}</h2>
                                    <p className="section-description">{t('admin.usersDesc')}</p>
                                </div>
                                <Button text={t('admin.newUser')} icon={faPlus} type="primary compact" onClick={() => setShowNewUserDialog(true)}/>
                            </div>
                            <div className="user-list">
                                {users.map(u => (
                                    <div key={u.id} className="user-card">
                                        <div className="user-info">
                                            <FontAwesomeIcon icon={u.role === 'admin' ? faShieldAlt : faChalkboardTeacher} className={`role-icon ${u.role}`}/>
                                            <div>
                                                <span className="user-name">{u.username}</span>
                                                <span className="user-role">{u.role === 'admin' ? t('admin.administrator') : t('admin.teacher')}</span>
                                            </div>
                                        </div>
                                        <div className="user-actions">
                                            {u.id !== user?.id && (
                                                <>
                                                    <button className="icon-btn" title={t('admin.roleSwitch')} onClick={() => toggleRole(u.id, u.role)}>
                                                        <FontAwesomeIcon icon={u.role === 'admin' ? faChalkboardTeacher : faShieldAlt}/>
                                                    </button>
                                                    <button className="icon-btn" title={t('admin.passwordReset')} onClick={() => {setPasswordResetUserId(u.id); setShowPasswordDialog(true);}}>
                                                        <FontAwesomeIcon icon={faKey}/>
                                                    </button>
                                                    <button className="icon-btn danger" title={t('admin.delete')} onClick={() => deleteUserHandler(u.id, u.username)}>
                                                        <FontAwesomeIcon icon={faTrash}/>
                                                    </button>
                                                </>
                                            )}
                                            {u.id === user?.id && <span className="you-badge">{t('admin.you')}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
            </motion.div>

            <Dialog
                isOpen={showNewUserDialog}
                onClose={() => {setShowNewUserDialog(false); setNewUserError('');}}
                onConfirm={createUser}
                title={t('admin.newUser')}
                confirmText={t('admin.createUser')}
                cancelText={t('admin.cancel')}
            >
                <div className="new-user-form">
                    <Input placeholder={t('loginDialog.usernamePlaceholder')} value={newUsername} onChange={(e) => {setNewUsername(e.target.value); setNewUserError('');}}/>
                    <Input type="password" placeholder={t('loginDialog.passwordPlaceholder')} value={newPassword} onChange={(e) => {setNewPassword(e.target.value); setNewUserError('');}}/>
                    <SelectBox
                        value={newRole}
                        onChange={setNewRole}
                        options={[
                            {value: 'teacher', label: t('admin.teacher'), icon: faChalkboardTeacher},
                            {value: 'admin', label: t('admin.administrator'), icon: faShieldAlt}
                        ]}
                    />
                    {newUserError && <div className="form-error">{newUserError}</div>}
                </div>
            </Dialog>

            <Dialog
                isOpen={showPasswordDialog}
                onClose={() => {setShowPasswordDialog(false); setNewPasswordValue('');}}
                onConfirm={resetPassword}
                title={t('admin.resetPassword')}
                confirmText={t('admin.resetPassword')}
                cancelText={t('admin.cancel')}
            >
                <div className="new-user-form">
                    <Input type="password" placeholder={t('admin.newPassword')} value={newPasswordValue} onChange={(e) => setNewPasswordValue(e.target.value)}/>
                </div>
            </Dialog>
        </div>
    );
};