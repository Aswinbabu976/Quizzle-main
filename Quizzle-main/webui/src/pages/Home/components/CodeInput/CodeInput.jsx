import CodeWrapper from "@/pages/Home/components/CodeWrapper";
import Button from "@/common/components/Button";
import {faQrcode} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from 'react-i18next';
import "./styles.sass";

export const CodeInput = ({joinGame, errorClass, scanQr}) => {
    const { t } = useTranslation();
    return (
        <>
            <h2>{t('codeInput.enterCode')}</h2>
            <CodeWrapper onChange={joinGame} errorClass={errorClass}/>
            <div className="alternative">
                <hr/>
                <h2>{t('home.or')}</h2>
                <hr/>
            </div>
            <Button text={t('codeInput.scanCode')} icon={faQrcode} padding={"0.7rem 1.5rem"} onClick={() => scanQr()}/>
        </>
    )
}