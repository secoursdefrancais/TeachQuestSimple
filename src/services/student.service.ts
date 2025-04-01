// src/services/student.service.ts

import { storageService } from './storage.service';
import { Student, StudentGroup, Evaluation } from '../types';

class StudentService {
  // Méthode pour recharger les données
  public reloadData(): void {
    // Pas besoin de faire quoi que ce soit de spécial car toutes les méthodes
    // vont directement chercher les données dans le storageService
  }

  // Récupérer tous les groupes d'étudiants
  getAllStudentGroups(): StudentGroup[] {
    return storageService.getCollection<StudentGroup>('students');
  }
  
  // Récupérer tous les étudiants (aplatir la structure de groupes)
  getAllStudents(): Student[] {
    const groups = this.getAllStudentGroups();
    return groups.flatMap(group => group.students);
  }
  
  // Récupérer les étudiants d'un groupe spécifique
  getStudentsByGroup(groupName: string): Student[] {
    const groups = this.getAllStudentGroups();
    const group = groups.find(g => g.group === groupName);
    return group ? group.students : [];
  }
  
  // Récupérer un étudiant par son ID
  getStudentById(id: string): Student | undefined {
    const students = this.getAllStudents();
    return students.find(student => student.id === id);
  }
  
  // Récupérer une évaluation par son ID
  getEvaluationById(id: string): Evaluation | null {
    const evaluations = storageService.getCollection<Evaluation>('evaluations');
    return evaluations.find(ev => ev.id === id) || null;
  }
  
  // Récupérer les évaluations pour un groupe
  getEvaluationsByGroup(group: string): Evaluation[] {
    const evaluations = storageService.getCollection<Evaluation>('evaluations');
    return evaluations.filter(ev => ev.group === group);
  }
  
  // Ajouter ou mettre à jour un étudiant
  saveStudent(student: Student, groupName: string): void {
    const groups = this.getAllStudentGroups();
    let groupIndex = groups.findIndex(g => g.group === groupName);
    
    if (groupIndex === -1) {
      // Créer un nouveau groupe si nécessaire
      groups.push({
        group: groupName,
        students: [student]
      });
    } else {
      // Mettre à jour ou ajouter l'étudiant au groupe
      const studentIndex = groups[groupIndex].students.findIndex(s => s.id === student.id);
      if (studentIndex === -1) {
        groups[groupIndex].students.push(student);
      } else {
        groups[groupIndex].students[studentIndex] = student;
      }
    }
    
    storageService.setCollection('students', groups);
  }
  
  // Calculer les statistiques d'un étudiant
  getStudentStats(studentId: string): {
    evaluationsCount: number;
    averageGrade: number;
    completedEvaluations: number;
  } {
    const student = this.getStudentById(studentId);
    if (!student) {
      return {
        evaluationsCount: 0,
        averageGrade: 0,
        completedEvaluations: 0
      };
    }
    
    // Trouver le groupe de l'étudiant
    const groups = this.getAllStudentGroups();
    const group = groups.find(g => g.students.some(s => s.id === studentId));
    if (!group) {
      return {
        evaluationsCount: 0,
        averageGrade: 0,
        completedEvaluations: 0
      };
    }
    
    // Récupérer les évaluations du groupe
    const evaluations = this.getEvaluationsByGroup(group.group);
    
    // Compter les évaluations complétées par l'étudiant
    const completedEvals = evaluations.filter(ev => 
      ev.copies.some(copy => copy.studentId === studentId && copy.grade !== null)
    );
    
    // Calculer la moyenne
    let totalPoints = 0;
    let totalMaxPoints = 0;
    
    completedEvals.forEach(ev => {
      const copy = ev.copies.find(c => c.studentId === studentId);
      if (copy && copy.grade !== null) {
        totalPoints += copy.grade * ev.coefficient;
        totalMaxPoints += ev.maxPoints * ev.coefficient;
      }
    });
    
    const averageGrade = totalMaxPoints > 0 ? (totalPoints / totalMaxPoints) * 20 : 0;
    
    return {
      evaluationsCount: evaluations.length,
      averageGrade,
      completedEvaluations: completedEvals.length
    };
  }
}

export const studentService = new StudentService();
export default studentService;