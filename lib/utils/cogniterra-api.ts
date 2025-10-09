/**
 * Cogniterra API Client
 * Handles authentication and data fetching from Cogniterra REST API
 */

interface CogniterraConfig {
  apiUrl: string;
  clientId: string;
  clientSecret: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface Section {
  id: number;
  title: string;
  position: number;
  lessons: number[];
  course: number;
}

interface SectionsResponse {
  sections: Section[];
}

interface Lesson {
  id: number;
  title: string;
  position: number;
  steps: number[];
  section: number;
}

interface LessonsResponse {
  lessons: Lesson[];
}

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Get Cogniterra API configuration from environment variables
 */
function getConfig(): CogniterraConfig {
  const apiUrl = process.env.COGNITERRA_API_URL;
  const clientId = process.env.COGNITERRA_CLIENT_ID;
  const clientSecret = process.env.COGNITERRA_CLIENT_SECRET;

  if (!apiUrl || !clientId || !clientSecret) {
    throw new Error('Cogniterra API credentials not configured. Please set COGNITERRA_API_URL, COGNITERRA_CLIENT_ID, and COGNITERRA_CLIENT_SECRET in environment variables.');
  }

  return { apiUrl, clientId, clientSecret };
}

/**
 * Authenticate with Cogniterra API and get access token
 */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 5 minute buffer)
  const now = Date.now();
  if (cachedToken && tokenExpiry > now + 5 * 60 * 1000) {
    return cachedToken;
  }

  const config = getConfig();
  
  // Create Basic Auth header
  const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
  
  const response = await fetch(`${config.apiUrl}/oauth2/token/`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to authenticate with Cogniterra API: ${response.status} ${errorText}`);
  }

  const data: TokenResponse = await response.json();
  
  if (!data.access_token) {
    throw new Error('No access token received from Cogniterra API');
  }

  // Cache token
  cachedToken = data.access_token;
  tokenExpiry = now + (data.expires_in * 1000);

  return cachedToken;
}

/**
 * Fetch a single section by ID
 */
async function fetchSection(sectionId: number): Promise<Section | null> {
  const config = getConfig();
  const token = await getAccessToken();

  const response = await fetch(`${config.apiUrl}/api/sections/${sectionId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    console.warn(`Section ${sectionId} not found`);
    return null;
  }

  const data: SectionsResponse = await response.json();
  return data.sections && data.sections.length > 0 ? data.sections[0] : null;
}

/**
 * Fetch sections (modules) for a given course
 */
export async function fetchCourseSections(courseId: number): Promise<Section[]> {
  const config = getConfig();
  const token = await getAccessToken();

  const response = await fetch(`${config.apiUrl}/api/sections?course=${courseId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch sections from Cogniterra API: ${response.status} ${errorText}`);
  }

  const data: SectionsResponse = await response.json();
  
  return data.sections || [];
}

/**
 * Fetch sections by their IDs (batch request)
 */
export async function fetchSectionsByIds(sectionIds: number[]): Promise<Section[]> {
  const sections: Section[] = [];
  
  // Fetch in batches of 30 to avoid URL length limits
  const batchSize = 30;
  for (let i = 0; i < sectionIds.length; i += batchSize) {
    const batch = sectionIds.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(id => fetchSection(id)));
    sections.push(...results.filter((s): s is Section => s !== null));
  }
  
  return sections;
}

/**
 * Build a map of module_id -> module_title from a list of module IDs
 */
export async function getModuleNamesMapByIds(moduleIds: number[]): Promise<Record<number, string>> {
  const sections = await fetchSectionsByIds(moduleIds);
  
  const map: Record<number, string> = {};
  for (const section of sections) {
    map[section.id] = section.title;
  }
  
  return map;
}

/**
 * Build a map of module_id -> module_title (legacy - uses course_id)
 */
export async function getModuleNamesMap(courseId: number): Promise<Record<number, string>> {
  const sections = await fetchCourseSections(courseId);
  
  const map: Record<number, string> = {};
  for (const section of sections) {
    map[section.id] = section.title;
  }
  
  return map;
}

/**
 * Get module name by ID, with fallback
 */
export function getModuleName(moduleId: number, moduleNamesMap: Record<number, string>): string {
  return moduleNamesMap[moduleId] || `Module ${moduleId}`;
}

/**
 * Fetch a single lesson by ID
 */
async function fetchLesson(lessonId: number): Promise<Lesson | null> {
  const config = getConfig();
  const token = await getAccessToken();

  const response = await fetch(`${config.apiUrl}/api/lessons/${lessonId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    console.warn(`Lesson ${lessonId} not found`);
    return null;
  }

  const data: LessonsResponse = await response.json();
  return data.lessons && data.lessons.length > 0 ? data.lessons[0] : null;
}

/**
 * Fetch multiple lessons by IDs (batch)
 */
export async function fetchLessonsByIds(lessonIds: number[]): Promise<Lesson[]> {
  const lessons: Lesson[] = [];
  const batchSize = 30; // Process in batches to avoid overwhelming the API
  
  for (let i = 0; i < lessonIds.length; i += batchSize) {
    const batch = lessonIds.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(id => fetchLesson(id)));
    lessons.push(...results.filter((l): l is Lesson => l !== null));
  }
  
  return lessons;
}

/**
 * Build a map of lesson_id -> lesson_title from a list of lesson IDs
 */
export async function getLessonNamesMapByIds(lessonIds: number[]): Promise<Record<number, string>> {
  const lessons = await fetchLessonsByIds(lessonIds);
  const map: Record<number, string> = {};
  
  for (const lesson of lessons) {
    map[lesson.id] = lesson.title;
  }
  
  return map;
}

