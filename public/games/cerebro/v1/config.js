const Config = {
    APP_NAME: "Cerebro",
    VERSION: "1.0",

    // Rendu
    GRID_SIZE: 48, // Pixels
    BACKGROUND_COLOR: '#f0f2f5',
    GRID_COLOR: 'rgba(0, 0, 0, 0.05)',

    // Neurones
    NODE_RADIUS: 24,
    NODE_COLOR_DEFAULT: '#ffffff',
    NODE_STROKE_DEFAULT: '#333333',
    NODE_SELECTED_COLOR: '#e3f2fd',

    // Visualisation Neurone (Carte)
    NODE_WIDTH: 160,
    NODE_HEIGHT: 100, // Hauteur max
    NODE_HEADER_HEIGHT: 30,
    NODE_FONT_SIZE_TITLE: 14,
    NODE_FONT_SIZE_BODY: 10,
    NODE_TEXT_COLOR: '#2c3e50',

    // Synapses
    LINK_COLOR_DEFAULT: '#bdc3c7',
    LINK_WIDTH_DEFAULT: 2,

    // Navigation
    ZOOM_MIN: 0.1,
    ZOOM_MAX: 5.0,
    ZOOM_SENSITIVITY: 0.001,

    // Types de Neurones (Icones)
    NODE_TYPES: {
        TEXT: { id: 'text', icon: '📝', color: '#ecf0f1' },
        IMAGE: { id: 'image', icon: '🖼️', color: '#ffeaa7' },
        VIDEO: { id: 'video', icon: '🎥', color: '#ff7675' },
        TABLE: { id: 'table', icon: '📊', color: '#74b9ff' },
        TEMPLATE: { id: 'template', icon: '📄', color: '#a29bfe' }
    },

    // Types de Synapses
    LINK_TYPES: {
        ANALOGY: { id: 'analogy', color: '#f1c40f', style: 'solid', label: 'Analogie' },   // Jaune
        CAUSE: { id: 'cause', color: '#2ecc71', style: 'solid', label: 'Cause' },      // Vert
        OPPOSE: { id: 'oppose', color: '#e74c3c', style: 'solid', label: 'Oppose' },     // Rouge
        INSPIRE: { id: 'inspire', color: '#9b59b6', style: 'dashed', label: 'Inspire' },    // Violet (Ondulé impossible nativement p5 simple -> dashed)
        SUITE: { id: 'suite', color: '#3498db', style: 'solid', label: 'Suite' },      // Bleu
        METAPHOR: { id: 'metaphor', color: '#d35400', style: 'dotted', label: 'Métaphore' }   // Marron
    }
};

window.Config = Config;
