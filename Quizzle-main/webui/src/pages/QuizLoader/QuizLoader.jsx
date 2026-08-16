import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { BrandingContext } from "@/common/contexts/Branding";
import "./styles.sass";
import Input from "@/common/components/Input";
import Button from "@/common/components/Button";
import { faFileImport, faFileUpload, faPlay } from "@fortawesome/free-solid-svg-icons";
import { QuizContext } from "@/common/contexts/Quiz";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import UploadImage from "./assets/Upload.jsx";

export default function QuizLoader() {
  const { t } = useTranslation();
  const { setCirclePosition } = useOutletContext();
  const { titleImg, name } = useContext(BrandingContext);
  const { loadQuizById, loadQuizByContent, isLoaded } = useContext(QuizContext);
  const [dragActive, setDragActive] = useState(false);
  const query = new URLSearchParams(window.location.search);
  const navigate = useNavigate();
  const [quizId, setQuizId] = useState(query.get("id") || "");

  const runImport = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const loaded = loadQuizByContent(e.target.result);
        if (!loaded) throw new Error("Invalid file format.");

        toast.success(t('quizCreator.importSuccess'));
        setCirclePosition(["-18rem 0 0 45%", "-35rem 0 0 55%"]);
        setTimeout(() => navigate("/host/lobby"), 500);
      } catch (err) {
        toast.error(t('quizCreator.errors.importFailed'));
      }
    };
    reader.readAsArrayBuffer(file);
  };
n  const importQuiz = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".quizzle";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) runImport(file);
    };
    input.click();
  };

  const loadQuiz = async () => {
    const res = await loadQuizById(quizId);
    if (!res) {
      toast.error(t('quizLoader.quizIdNotFound', { name }));
      return;
    }
n    toast.success(t('quizCreator.importSuccess'));
    setCirclePosition(["-18rem 0 0 45%", "-35rem 0 0 55%"]);
    setTimeout(() => navigate("/host/lobby"), 500);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    try {
      const file = e.dataTransfer.files[0];
      if (file) runImport(file);
    } catch (err) {
      toast.error(t('quizCreator.errors.importFailed'));
    }
  };
n  useEffect(() => {
    setCirclePosition(["-35rem 0 0 55%", "-18rem 0 0 45%"]);
  }, [setCirclePosition]);

  useEffect(() => {
    if (isLoaded) navigate("/host/lobby");
  }, [isLoaded, navigate]);

  return (
    <div
      className="loader-page"
      onDrop={onDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
    >
      {dragActive && (
        <div className="drag-overlay">
          <div className="drag-container">
            <FontAwesomeIcon icon={faFileImport} size="3x" />
            <h2>{t('quizLoader.dropHere')}</h2>
          </div>
        </div>
      )}

      <div className="quiz-loader">
        <Link to="/"><img src={titleImg} alt="logo" /></Link>
        <div className="code-input">
          <Input placeholder={t('quizLoader.idPlaceholder')} value={quizId} onChange={(e) => setQuizId(e.target.value)} />
          <Button icon={faPlay} padding="0.8rem 1.5rem" onClick={loadQuiz} />
        </div>
        <div className="alternative">
          <hr />
          <h2>{t('home.or')}</h2>
          <hr />
        </div>
n        <Button icon={faFileUpload} text={t('quizLoader.uploadFile')} padding="0.8rem 1.5rem" onClick={importQuiz} />
      </div>
n      <UploadImage className="upload-image" />
    </div>
  );
}
