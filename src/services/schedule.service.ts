// src/services/schedule.service.ts

import { storageService } from './storage.service';
import { format, isSameDay, isWithinInterval, addDays, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { StudentInternship, Subject } from '../types';

// Interfaces pour les classes et événements
export interface ScheduleClass {
    subject: string;
    group: string;
    room: string;
    startTime: string;
    endTime: string;
    alternating?: boolean;
    weekType?: string;
    note?: string;
}

export interface ScheduleDay {
    day: string;
    classes: ScheduleClass[];
}

// Union de types pour les événements
export interface DateRangeEvent {
    type: string;
    name: string;
    startDate: string;
    endDate: string;
    description?: string;
    groups?: string[];
}

export interface SingleDayEvent {
    type: string;
    name: string;
    date: string;
    dayOfWeek?: string;
    startTime?: string;
    endTime?: string;
    room?: string;
    taskCategoryId?: number;
    note?: string;
    description?: string;
    groups?: string[];
}

export type PeriodEvent = DateRangeEvent | SingleDayEvent;

export interface InternshipPeriod {
    group: string;
    startDate: string;
    endDate: string;
    visitRequired: boolean;
    visitScheduled: boolean;
    reportDeadline: string;
}

export class ScheduleService {
    private scheduleData: any = null;
    private daysOfWeek = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'];

    constructor() {
        this.loadScheduleData();
    }

    private loadScheduleData() {
        // Récupérer directement depuis le storageService
        this.scheduleData = {
            regularSchedule: storageService.getData('regularSchedule') || [],
            holidays: storageService.getData('holidays') || [],
            specialEvents: storageService.getData('specialEvents') || [],
            internshipPeriods: storageService.getData('internshipPeriods') || [],
            alternatingWeeks: storageService.getData('alternatingWeeks') || null
        };
    }

    // Méthode pour recharger les données
    public reloadData(): void {
        this.loadScheduleData();
    }

    // Récupérer l'emploi du temps régulier
    getRegularSchedule(): ScheduleDay[] {
        if (!this.scheduleData || !this.scheduleData.regularSchedule) {
            return [];
        }
        return this.scheduleData.regularSchedule;
    }

    // Récupérer les événements spéciaux
    getSpecialEvents(): SingleDayEvent[] {
        if (!this.scheduleData || !this.scheduleData.specialEvents) {
            return [];
        }
        return this.scheduleData.specialEvents;
    }

    // Récupérer les périodes de vacances et fériés
    getHolidays(): PeriodEvent[] {
        if (!this.scheduleData || !this.scheduleData.holidays) {
            return [];
        }
        return this.scheduleData.holidays;
    }

    // Récupérer les périodes de stage
    getInternshipPeriods(): InternshipPeriod[] {
        if (!this.scheduleData || !this.scheduleData.internshipPeriods) {
            return [];
        }
        return this.scheduleData.internshipPeriods;
    }

    // Vérifier si une date est un jour de vacances
    isHoliday(date: Date): boolean {
        const holidays = this.getHolidays();

        // Formater la date au format ISO (YYYY-MM-DD)
        const formattedDate = format(date, 'yyyy-MM-dd');

        for (const holiday of holidays) {
            // Si c'est un jour spécifique (vérification de type)
            if ('date' in holiday && holiday.date === formattedDate) {
                return true;
            }

            // Si c'est une période (vérification de type)
            if ('startDate' in holiday && 'endDate' in holiday) {
                const start = parseISO(holiday.startDate);
                const end = parseISO(holiday.endDate);

                if (isWithinInterval(date, { start, end })) {
                    return true;
                }
            }
        }

        return false;
    }

    // Obtenir la raison de l'absence de cours pour une date donnée
    getHolidayInfoForDate(date: Date): { name: string; type: string } | null {
        const formattedDate = format(date, 'yyyy-MM-dd');
        const holidays = this.getHolidays();

        // Chercher dans les jours fériés ou vacances
        for (const holiday of holidays) {
            // Si c'est un jour spécifique
            if ('date' in holiday && holiday.date === formattedDate) {
                return { name: holiday.name, type: holiday.type };
            }

            // Si c'est une période de vacances
            if ('startDate' in holiday && 'endDate' in holiday) {
                const start = parseISO(holiday.startDate);
                const end = parseISO(holiday.endDate);

                if (isWithinInterval(date, { start, end })) {
                    return { name: holiday.name, type: holiday.type };
                }
            }
        }

        // Vérifier les périodes de stage qui pourraient affecter tous les cours
        const internshipPeriods = this.getInternshipPeriods();
        const groupsInternship: string[] = [];

        // Récupérer le jour de la semaine
        const dayOfWeek = format(date, 'EEEE', { locale: fr });

        // Récupérer les cours normalement prévus ce jour
        const regularSchedule = this.getRegularSchedule();
        const daySchedule = regularSchedule.find(day => day.day === dayOfWeek);

        // Si pas de cours prévus ce jour de la semaine, pas besoin de vérifier les stages
        if (!daySchedule || daySchedule.classes.length === 0) {
            return null;
        }

        // Collecter les groupes qui auraient normalement cours ce jour
        const scheduledGroups = new Set(daySchedule.classes.map(c => c.group));

        // Vérifier quels groupes sont en stage
        for (const period of internshipPeriods) {
            if (scheduledGroups.has(period.group) &&
                period.startDate && period.endDate &&
                isWithinInterval(date, {
                    start: parseISO(period.startDate),
                    end: parseISO(period.endDate)
                })) {
                groupsInternship.push(period.group);
            }
        }

        if (groupsInternship.length > 0) {
            // Si tous les groupes prévus sont en stage
            if (groupsInternship.length >= scheduledGroups.size) {
                return {
                    name: `Stage${groupsInternship.length > 1 ? 's' : ''}: ${groupsInternship.join(', ')}`,
                    type: 'internship'
                };
            }
        }

        return null;
    }

    // Déterminer si un cours a lieu à une date donnée
    shouldDisplayClass(classItem: ScheduleClass, date: Date, dayOfWeek: string): boolean {
        // Vérifier si la date est un jour de vacances
        if (this.isHoliday(date)) {
            return false;
        }

        // Vérifier les semaines alternées
        if (classItem.alternating && this.scheduleData && this.scheduleData.alternatingWeeks) {
            const { startReference, referenceType } = this.scheduleData.alternatingWeeks;

            if (startReference) {
                const referenceDate = parseISO(startReference);

                // Calculer le nombre de semaines depuis la référence
                const diffInDays = Math.floor((date.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
                const diffInWeeks = Math.floor(diffInDays / 7);

                // Déterminer si c'est une semaine paire ou impaire
                const isOddWeek = (diffInWeeks % 2 === 0) === (referenceType === 'odd');

                if ((isOddWeek && classItem.weekType !== 'odd') ||
                    (!isOddWeek && classItem.weekType !== 'even')) {
                    return false;
                }
            }
        }

        // Vérifier si le groupe est en stage
        const internshipPeriods = this.getInternshipPeriods();
        for (const period of internshipPeriods) {
            if (period.group === classItem.group &&
                period.startDate && period.endDate &&
                isWithinInterval(date, {
                    start: parseISO(period.startDate),
                    end: parseISO(period.endDate)
                })) {
                return false;
            }
        }

        return true;
    }

    // Récupérer l'emploi du temps pour une date donnée
    getScheduleForDate(date: Date): ScheduleClass[] {
        try {
            const regularSchedule = this.getRegularSchedule();
            const dayOfWeek = format(date, 'EEEE', { locale: fr });
            const result: ScheduleClass[] = [];

            // Trouver le jour dans l'emploi du temps régulier
            const daySchedule = regularSchedule.find(day => day.day === dayOfWeek);

            if (daySchedule) {
                // Filtrer les cours qui ont lieu ce jour-là
                for (const classItem of daySchedule.classes) {
                    if (this.shouldDisplayClass(classItem, date, dayOfWeek)) {
                        result.push(classItem);
                    }
                }
            }

            // Ajouter les événements spéciaux pour cette date
            const specialEvents = this.getSpecialEvents();
            const formattedDate = format(date, 'yyyy-MM-dd');

            for (const event of specialEvents) {
                if (event.date === formattedDate) {
                    // S'assurer que startTime et endTime sont définis avec des valeurs par défaut
                    const startTime = event.startTime || '00:00';
                    const endTime = event.endTime || '23:59';

                    result.push({
                        subject: event.name,
                        group: '',
                        room: event.room || '',
                        startTime: startTime,
                        endTime: endTime,
                        note: event.note
                    });
                }
            }

            // Trier par heure de début avec gestion des erreurs
            return result.sort((a, b) => {
                // Vérifier si startTime existe
                if (!a.startTime || !b.startTime) {
                    return 0; // Garder l'ordre original si l'une des heures est manquante
                }

                try {
                    const timeA = a.startTime.split(':').map(Number);
                    const timeB = b.startTime.split(':').map(Number);

                    // Vérifier si le format est valide
                    if (timeA.length < 2 || timeB.length < 2 ||
                        isNaN(timeA[0]) || isNaN(timeA[1]) ||
                        isNaN(timeB[0]) || isNaN(timeB[1])) {
                        return 0;
                    }

                    if (timeA[0] !== timeB[0]) {
                        return timeA[0] - timeB[0];
                    }

                    return timeA[1] - timeB[1];
                } catch (error) {
                    console.error("Erreur lors du tri des heures:", error);
                    return 0;
                }
            });
        } catch (error) {
            console.error("Erreur dans getScheduleForDate:", error);
            return [];
        }
    }

    // Récupérer l'emploi du temps pour une semaine
    getScheduleForWeek(startDate: Date): Record<string, ScheduleClass[]> {
        try {
            const result: Record<string, ScheduleClass[]> = {};

            for (let i = 0; i < 5; i++) {
                const currentDate = addDays(startDate, i);
                const formattedDate = format(currentDate, 'yyyy-MM-dd');
                result[formattedDate] = this.getScheduleForDate(currentDate);
            }

            return result;
        } catch (error) {
            console.error("Erreur dans getScheduleForWeek:", error);
            return {};
        }
    }

    getStudentInternships(): StudentInternship[] {
        return storageService.getCollection<StudentInternship>('studentInternships');
    }

    // Sauvegarder l'emploi du temps régulier
    public saveRegularSchedule(schedule: any[]): boolean {
        // Mettre à jour les données en mémoire
        if (this.scheduleData) {
            this.scheduleData.regularSchedule = schedule;
        }

        // Sauvegarder dans le storageService
        return storageService.setData('regularSchedule', schedule);
    }

    // Sauvegarder les jours fériés et périodes de vacances
    public saveHolidays(holidays: any[]): boolean {
        // Mettre à jour les données en mémoire
        if (this.scheduleData) {
            this.scheduleData.holidays = holidays;
        }

        // Sauvegarder dans le storageService
        return storageService.setData('holidays', holidays);
    }

    // Mettre à jour la référence des semaines alternées
    public saveAlternatingWeeks(alternatingWeeks: {
        startReference: string;
        referenceType: 'odd' | 'even';
        description?: string;
    }): boolean {
        // Mettre à jour les données en mémoire
        if (this.scheduleData) {
            this.scheduleData.alternatingWeeks = alternatingWeeks;
        }

        // Sauvegarder dans le storageService
        return storageService.setData('alternatingWeeks', alternatingWeeks);
    }

    // Sauvegarder les périodes de stage
    public saveInternshipPeriods(periods: InternshipPeriod[]): boolean {
        // Mettre à jour les données en mémoire
        if (this.scheduleData) {
            this.scheduleData.internshipPeriods = periods;
        }

        // Sauvegarder dans le storageService
        return storageService.setData('internshipPeriods', periods);
    }
}

export const scheduleService = new ScheduleService();
export default scheduleService;