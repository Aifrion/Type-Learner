import { useState } from 'react';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { QuizQuestion, Quiz } from '../types';

export const useQuizDatabase = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  // Fetch existing quiz by ID
  const getQuiz = async (quizId: string): Promise<Quiz | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const docRef = doc(db, 'quizzes', quizId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Quiz;
      }
      return null;
    } catch (err) {
      console.error("Error fetching quiz:", err);
      setError("Failed to fetch quiz details.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Update existing quiz
  const updateQuiz = async (quizId: string, title: string, questions: QuizQuestion[]): Promise<boolean> => {
    setIsSaving(true);
    setError(null);
    try {
      const docRef = doc(db, 'quizzes', quizId);
      await updateDoc(docRef, {
        title,
        questions,
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (err) {
      console.error("Error updating quiz:", err);
      setError("Failed to update quiz. Please try again.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return { saveQuiz, getQuiz, updateQuiz, isSaving, isLoading, error };
};