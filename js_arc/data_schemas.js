/** @format */
"use strict";

/**
 * This file defines the structural schemas for various data types used in the application,
 * primarily for data stored in LocalStorage and IndexedDB.
 * Each SCHEMA_ constant holds a JavaScript object (or primitive) representing the
 * expected structure of the data, often with empty placeholders, serving as a template.
 */

// --- IndexedDB Schemas ---

export const SCHEMA_KNBASE = {
    title: "",
    content: "",
};

export const SCHEMA_CONTEXT = {
    query: "",
    extracted_context: "",
};

export const SCHEMA_CONTEXT_LST = [
    {
        name: "",
        data: {
            query: "",
            extracted_context: "",
        },
    },
];

export const SCHEMA_KNBASE_LST = [
    {
        doc: "",
        kb_summary: "",
    },
];

export const SCHEMA_THREAD = [
    {
        role: "", // "user" or "assistant"
        content: "",
    },
];

export const SCHEMA_THREAD_LST = [
    {
        id: "",
        messages: [], // Will contain objects matching SCHEMA_THREAD structure
    },
];

// --- LocalStorage Schemas ---

export const SCHEMA_PROVIDER = {
    provider: "",
    model: "",
    windowSize: 0,
    adapter: "",
};

export const SCHEMA_DOC_TYPE = ""; // Simple string

export const SCHEMA_THEME = ""; // Simple string, e.g., "dark" or "light"

export const SCHEMA_RESPONSES = []; // Array of strings

export const SCHEMA_DOC_NAMES = []; // Array of strings

export const SCHEMA_DOCS = []; // Array of strings

export const SCHEMA_BASEKB = {
    summary: "",
};

export const SCHEMA_BASEKBS = {}; // Object where keys are names and values are objects (e.g., { "kb_name": { data: "" } })

export const SCHEMA_RAG_CONTEXT = ""; // Simple string
