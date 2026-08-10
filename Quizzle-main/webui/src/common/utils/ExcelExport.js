import * as XLSX from 'xlsx';

const autoSizeColumns = (worksheet, data) => {
    const colWidths = [];

    data.forEach(row => {
        row.forEach((cell, colIndex) => {
            const cellValue = String(cell || '');
            const cellWidth = Math.max(cellValue.length + 2, 10);

            if (!colWidths[colIndex] || cellWidth > colWidths[colIndex]) {
                colWidths[colIndex] = Math.min(cellWidth, 50);
            }
        });
    });

    worksheet['!cols'] = colWidths.map(width => ({width}));
};

const exportAnalyticsToExcel = (analyticsData, quizData = null, isLiveQuiz = false, quizName = 'Quiz') => {
    const {classAnalytics, questionAnalytics, studentAnalytics} = analyticsData;

    const workbook = XLSX.utils.book_new();

    const overviewData = [
        ['Quizzle Analytics Export'],
        [''],
                ['Quiz Information'],
                ['Quiz Type', isLiveQuiz ? 'Live Quiz' : 'Practice Quiz'],
        ['Quiz Name', quizName],
                ['Export Date', new Date().toLocaleDateString('en-US')],
                ['Export Time', new Date().toLocaleTimeString('en-US')],
        [''],
                ['Class Overview'],
                ['Total students', classAnalytics.totalStudents],
                ['Total questions', classAnalytics.totalQuestions],
                ['Average score', classAnalytics.averageScore],
                ['Average accuracy (%)', classAnalytics.averageAccuracy],
                ['Questions needing review', classAnalytics.questionsNeedingReview],
                ['Students needing attention', classAnalytics.studentsNeedingAttention],
                ['Participation rate (%)', classAnalytics.participationRate || 100]
    ];

    if (isLiveQuiz) {
            overviewData.push(['Total attempts', classAnalytics.totalAttempts || 'N/A']);
    } else {
            overviewData.push(['Total attempts', classAnalytics.totalAttempts]);
    }

    const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
    autoSizeColumns(overviewSheet, overviewData);
        XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Overview');

    const studentHeaders = [
            'Student Name',
            'Character',
            'Total points',
            'Correct answers',
            'Partially correct answers',
            'Incorrect answers',
            'Total answered',
            'Accuracy (%)',
            'Needs attention',
            'Performance level'
    ];

    if (!isLiveQuiz) {
        studentHeaders.splice(8, 0, 'Versuche', 'Durchschnittliche Punktzahl');
    }

    const studentData = [studentHeaders];

    studentAnalytics.forEach(student => {
        const performanceLevel = student.accuracy >= 80 ? 'Excellent' :
                    student.accuracy >= 60 ? 'Good' : 'Needs improvement';

        const row = [
            student.name,
            student.character,
            student.totalPoints,
            student.correctAnswers,
            student.partialAnswers || 0,
            student.incorrectAnswers,
            student.totalAnswered,
            student.accuracy,
            student.needsAttention ? 'Yes' : 'No',
            performanceLevel
        ];

        if (!isLiveQuiz) {
            row.splice(8, 0, student.attempts || 1, student.avgScore || student.totalPoints);
        }

        studentData.push(row);
    });

    const studentSheet = XLSX.utils.aoa_to_sheet(studentData);
    autoSizeColumns(studentSheet, studentData);
    XLSX.utils.book_append_sheet(workbook, studentSheet, 'Student Analytics');

    const questionHeaders = [
            'Question Nr.',
            'Question Title',
            'Question Type',
            'Total Responses',
            'Correct Count',
            'Partially correct Count',
            'Incorrect Count',
            'Correct Percentage (%)',
            'Difficulty',
            'Needs Review'
    ];

    const questionData = [questionHeaders];

    questionAnalytics.forEach(question => {
        const difficultyLabel = question.difficulty === 'easy' ? 'Easy' :
                    question.difficulty === 'medium' ? 'Medium' :
                        question.difficulty === 'hard' ? 'Hard' : 'Unknown';

        questionData.push([
            question.questionIndex + 1,
            question.title,
            question.type,
            question.totalResponses,
            question.correctCount,
            question.partialCount || 0,
            question.incorrectCount,
            question.correctPercentage,
                    difficultyLabel,
                    question.needsReview ? 'Yes' : 'No'
        ]);
    });

    const questionSheet = XLSX.utils.aoa_to_sheet(questionData);
    autoSizeColumns(questionSheet, questionData);
    XLSX.utils.book_append_sheet(workbook, questionSheet, 'Question Analytics');

    const summaryData = [
            ['Summary Statistics'],
        [''],
            ['Question difficulty distribution'],
            ['Easy questions', questionAnalytics.filter(q => q.difficulty === 'easy').length],
            ['Medium questions', questionAnalytics.filter(q => q.difficulty === 'medium').length],
            ['Hard questions', questionAnalytics.filter(q => q.difficulty === 'hard').length],
        [''],
            ['Student performance distribution'],
            ['Excellent (≥80%)', studentAnalytics.filter(s => s.accuracy >= 80).length],
            ['Good (60-79%)', studentAnalytics.filter(s => s.accuracy >= 60 && s.accuracy < 80).length],
            ['Needs improvement (<60%)', studentAnalytics.filter(s => s.accuracy < 60).length],
        [''],
            ['Top 5 Students'],
            ['Rank', 'Name', 'Score', 'Accuracy (%)']
    ];

    const sortedStudents = [...studentAnalytics]
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .slice(0, 5);

    sortedStudents.forEach((student, index) => {
        summaryData.push([
            index + 1,
            student.name,
            student.totalPoints,
            student.accuracy
        ]);
    });

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    autoSizeColumns(summarySheet, summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    const filename = `${quizName}_Analytics_${timestamp}.xlsx`;

    XLSX.writeFile(workbook, filename);

    return filename;
};

export const exportPracticeResultsToExcel = (results, practiceCode) => {
    const analyticsData = results.analytics;
    const quizName = `PracticeQuiz_${practiceCode}`;

    return exportAnalyticsToExcel(analyticsData, results.quiz, false, quizName);
};

export const exportLiveQuizToExcel = (analyticsData, quizName = 'LiveQuiz') => {
    return exportAnalyticsToExcel(analyticsData, null, true, quizName);
};