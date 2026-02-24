import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { QuizQuestion } from '../types';

export const useQuizDatabase = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Saves a newly created quiz to Firestore and links it to the teacher's profile.
   * * @param title - The title of the quiz.
   * @param questions - An array of question objects for the quiz.
   * @param ownerId - The ID of the currently authenticated teacher.
   * @returns A boolean indicating whether the save operation was successful.
   */
  const saveQuiz = async (
    title: string, 
    questions: QuizQuestion[],
    ownerId: string
  ): Promise<boolean> => {
    setIsSaving(true);
    setError(null);
    
    try {
      const colRef = collection(db, 'quizzes');
      await addDoc(colRef, {
        title,
        questions,
        ownerId,
        createdAt: serverTimestamp(),
      });
      return true; 
    } catch (err) {
      console.error("Error saving quiz:", err);
      setError("Failed to save quiz. Please try again.");
      return false; 
    } finally {
      setIsSaving(false);
    }
  };

  return { saveQuiz, isSaving, error };
};