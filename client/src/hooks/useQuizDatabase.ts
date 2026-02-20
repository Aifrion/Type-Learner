// client/src/hooks/useQuizDatabase.ts
import { useState } from 'react';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Quiz, QuizQuestion } from '../types';

export const useQuizDatabase = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch a single quiz by ID
  const fetchQuiz = async (quizId: string): Promise<Quiz | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const docRef = doc(db, 'quizzes', quizId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as Quiz;
      } else {
        setError("Quiz not found.");
        return null;
      }
    } catch (err) {
      console.error("Error fetching quiz:", err);
      setError("Failed to load quiz data.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new quiz or update an existing one
  const saveQuiz = async (
    quizId: string | undefined, 
    title: string, 
    questions: QuizQuestion[]
  ): Promise<boolean> => {
    setIsSaving(true);
    setError(null);
    
    try {
      const quizData = {
        title,
        questions,
        updatedAt: serverTimestamp(),
      };

      if (quizId) {
        // Update existing document
        const docRef = doc(db, 'quizzes', quizId);
        await updateDoc(docRef, quizData);
      } else {
        // Create new document
        const colRef = collection(db, 'quizzes');
        await addDoc(colRef, {
          ...quizData,
          createdAt: serverTimestamp(),
        });
      }
      return true; // Indicates success
    } catch (err) {
      console.error("Error saving quiz:", err);
      setError("Failed to save quiz. Please try again.");
      return false; // Indicates failure
    } finally {
      setIsSaving(false);
    }
  };

  return {
    fetchQuiz,
    saveQuiz,
    isSaving,
    isLoading,
    error
  };
};