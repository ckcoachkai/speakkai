export type FeedbackStudent = {id:string;name:string;en:string|null;zh:string|null;attendance?:'absent'};
export type BilingualSection = {en:string;zh:string}|null;
export type FeedbackSession = {id:string;date:string;time:string;status:'held'|'cancelled';students:FeedbackStudent[];classContent?:BilingualSection;homework?:BilingualSection};
export type FeedbackClass = {id:string;label:{en:string;zh:string};sessions:FeedbackSession[]};
export type FeedbackDocument = {version:number;updatedAt:string;timeZone:string;classes:FeedbackClass[]};
export type FeedbackLanguage = 'en'|'zh';
