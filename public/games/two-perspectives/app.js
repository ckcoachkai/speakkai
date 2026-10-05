(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const allowedLenses = ['stoic', 'open', 'pick-side', 'life', 'love', 'mind'];
  const lensLabels = {
    stoic: 'Stoic questions',
    open: 'Deep open-ended',
    'pick-side': 'Pick a side',
    life: 'Life & meaning',
    love: 'Love & attachment',
    mind: 'How you think'
  };
  const collectionLabels = {
    all: 'All',
    original: 'Stories + communication',
    china: 'China culture',
    thumbs: 'Yes-no + pick a side'
  };
  const collectionOrder = ['all', 'original', 'china', 'thumbs'];

  let questions = [];
  let sources = [];
  let deck = [];
  let position = -1;
  let current = null;
  let filterValue = 'all';

  function rawDataCandidate() {
    const bundles = [
      window.TWO_PERSPECTIVES_DATA,
      window.QUESTION_DATA,
      window.LIBRARY_DATA
    ];
    for (const bundle of bundles) {
      if (bundle && Array.isArray(bundle.questions)) return { questions: bundle.questions, sources: bundle.sources };
    }
    const arrays = [
      window.QUESTIONS_3000,
      window.QUESTIONS_V3,
      window.QUESTIONS,
      window.PILOT_QUESTIONS,
      window.QUESTIONS_60
    ];
    const array = arrays.find(item => Array.isArray(item) && item.length);
    return { questions: array || [], sources: window.SOURCES };
  }

  function cleanCollection(value) {
    const key = String(value || '').toLowerCase();
    if (key === 'q' || key === 'original' || key === 'stories' || key === 'communication') return 'original';
    if (key === 'c' || key === 'china') return 'china';
    if (key === 't' || key === 'thumbs' || key === 'yes-no' || key === 'yesno') return 'thumbs';
    return 'original';
  }

  function cleanLenses(raw) {
    const value = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(/[\s,|]+/) : [];
    return [...new Set(value.map(item => String(item).toLowerCase().trim()).filter(item => allowedLenses.includes(item)))];
  }

  function normalize(raw, index) {
    if (!raw || typeof raw !== 'object' || !String(raw.text || '').trim()) return null;
    const id = String(raw.id || `q${String(index + 1).padStart(4, '0')}`);
    const collection = cleanCollection(raw.collection || raw.bank || raw.kind || raw.type);
    const sourceIds = Array.isArray(raw.sourceIds) ? raw.sourceIds.map(String) : [];
    return {
      ...raw,
      id,
      collection,
      category: String(raw.category || raw.topic || 'Conversation starters'),
      intensity: String(raw.intensity || ''),
      text: String(raw.text).trim(),
      followup: raw.followup ? String(raw.followup).trim() : '',
      lenses: cleanLenses(raw.lenses ?? raw.lens ?? raw.tags),
      sourceIds
    };
  }

  function collectionCount(key) {
    return key === 'all' ? questions.length : questions.filter(q => q.collection === key).length;
  }

  function formatCount(value) {
    return Number(value).toLocaleString();
  }

  function updateEdition() {
    const edition = document.querySelector('.edition');
    if (edition) edition.innerHTML = `${formatCount(questions.length)} QUESTIONS<br><span>ADULT CONVERSATIONS</span>`;
  }

  function updateCollections() {
    const select = $('collection');
    const previous = select.value;
    select.replaceChildren();
    for (const key of collectionOrder) {
      const option = document.createElement('option');
      const count = collectionCount(key);
      option.value = key;
      option.textContent = `${collectionLabels[key]} · ${formatCount(count)}`;
      option.disabled = key !== 'all' && count === 0;
      select.append(option);
    }
    select.value = collectionCount(previous) || previous === 'all' ? previous : 'all';
    if (!select.value) select.value = 'all';
  }

  function categoryPool() {
    return questions.filter(q => $('collection').value === 'all' || q.collection === $('collection').value);
  }

  function addCountedOption(group, value, label, count) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = `${label} · ${formatCount(count)}`;
    group.append(option);
  }

  function updateCategories() {
    const select = $('category');
    const previous = select.value || 'all';
    const pool = categoryPool();
    const topicCounts = new Map();
    const lensCounts = new Map();
    for (const q of pool) {
      topicCounts.set(q.category, (topicCounts.get(q.category) || 0) + 1);
      for (const lens of q.lenses) lensCounts.set(lens, (lensCounts.get(lens) || 0) + 1);
    }
    select.replaceChildren();
    const all = document.createElement('option');
    all.value = 'all';
    all.textContent = `Every topic · ${formatCount(pool.length)}`;
    select.append(all);

    const lenses = document.createElement('optgroup');
    lenses.label = 'Go deeper';
    allowedLenses.filter(lens => lensCounts.has(lens)).forEach(lens => {
      addCountedOption(lenses, `lens:${lens}`, lensLabels[lens], lensCounts.get(lens));
    });
    if (lenses.children.length) select.append(lenses);

    const topics = document.createElement('optgroup');
    topics.label = `Topics · ${formatCount(topicCounts.size)}`;
    [...topicCounts.keys()].sort((a, b) => a.localeCompare(b)).forEach(category => {
      addCountedOption(topics, `topic:${category}`, category, topicCounts.get(category));
    });
    select.append(topics);
    const valid = [...select.options].some(option => !option.disabled && option.value === previous);
    select.value = valid ? previous : 'all';
  }

  function matchesFilter(q) {
    const collection = $('collection').value;
    if (collection !== 'all' && q.collection !== collection) return false;
    if (filterValue === 'all') return true;
    if (filterValue.startsWith('topic:')) return q.category === filterValue.slice(6);
    if (filterValue.startsWith('lens:')) return q.lenses.includes(filterValue.slice(5));
    return true;
  }

  function filteredPool() {
    return questions.filter(matchesFilter);
  }

  function shuffle(items) {
    const result = items.slice();
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function newRound(avoidId) {
    deck = shuffle(filteredPool());
    if (deck.length > 1 && avoidId && deck[0].id === avoidId) [deck[0], deck[1]] = [deck[1], deck[0]];
    position = deck.length ? 0 : -1;
  }

  function textLine(label, value) {
    if (!value) return;
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = `${label}: `;
    p.append(strong, document.createTextNode(value));
    $('infoBody').append(p);
  }

  function renderSources(q) {
    for (const sourceId of q.sourceIds) {
      const source = sources.find(item => String(item.id) === sourceId);
      if (!source) {
        textLine('Source', sourceId);
        continue;
      }
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = 'Source: ';
      p.append(strong);
      if (source.url) {
        const link = document.createElement('a');
        link.href = source.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = source.title || source.publisher || sourceId;
        p.append(link);
      } else p.append(document.createTextNode(source.title || sourceId));
      const meta = [source.publisher, source.date].filter(Boolean).join(' · ');
      if (meta) p.append(document.createTextNode(` (${meta})`));
      $('infoBody').append(p);
      textLine('Limit', source.limit);
      const note = String(source.verificationNote || '');
      const checkedDate = source.verificationDate || source.verifiedOn || source.checkedDate || source.lastChecked || source.reviewedOn || (note.match(/(?:checked|verified)(?: on)?[^0-9]*(\d{4}-\d{2}-\d{2})/i) || [])[1];
      if (checkedDate) {
        const parsed = new Date(checkedDate);
        textLine('Checked', Number.isNaN(parsed.getTime()) ? String(checkedDate) : parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }));
      }
      if (note && !/^(?:verified|verified-fulltext|checked)$/i.test(note.trim())) textLine('Source note', note);
    }
  }

  function renderInfo(q) {
    const panel = $('infoPanel');
    const body = $('infoBody');
    panel.open = false;
    body.replaceChildren();
    if (!q) {
      panel.hidden = true;
      return;
    }
    const hasCommunication = q.collection === 'original' && (String(q.communication || '').trim() || String(q.hostCue || '').trim());
    const hasChina = q.collection === 'china' && (q.context || q.sourceIds.length);
    const choiceValues = Array.isArray(q.choices) ? q.choices.map(choice => String(choice).trim()).filter(Boolean) : [];
    const yesNoOnly = choiceValues.length === 2 && choiceValues.every(choice => /^(yes|no)$/i.test(choice));
    const meaningfulChoices = choiceValues.length > 0 && (!yesNoOnly || q.decisionStyle === 'either-or');
    const hasThumbs = q.collection === 'thumbs' && (meaningfulChoices || Boolean(String(q.hostCue || '').trim()));
    if (!(hasCommunication || hasChina || hasThumbs)) {
      panel.hidden = true;
      return;
    }
    panel.hidden = false;
    $('infoSummary').textContent = hasCommunication ? 'Communication & host cue' : hasChina ? 'Context & sources' : 'Pick a side notes';
    if (hasCommunication) {
      textLine('Communication', q.communication);
      textLine('Try aloud', q.hostCue);
    }
    if (hasChina) {
      textLine('Context', q.context);
      textLine('Framing', 'This is a fictional conversation prompt. Sources provide context, not a verdict about people or popularity.');
      renderSources(q);
    }
    if (hasThumbs) {
      if (q.decisionStyle && q.decisionStyle !== 'yes-no') textLine('Decision style', q.decisionStyle === 'either-or' ? 'Pick a side, then explain the reason.' : q.decisionStyle);
      if (meaningfulChoices) textLine('Choices', choiceValues.join(' · '));
      textLine('Host cue', q.hostCue);
    }
  }

  function renderEmpty() {
    current = null;
    $('number').textContent = 'NO MATCHING QUESTIONS';
    $('topic').textContent = '';
    $('question').textContent = 'Choose another topic or collection.';
    $('question').removeAttribute('aria-label');
    $('followupArea').hidden = true;
    $('infoPanel').hidden = true;
    $('previous').disabled = true;
    $('next').disabled = true;
    $('progress').textContent = '0 questions in this selection';
  }

  function render(focus) {
    if (position < 0 || !deck[position]) {
      renderEmpty();
      return;
    }
    current = deck[position];
    $('number').textContent = current.id.toUpperCase();
    $('topic').textContent = filterValue.startsWith('lens:') ? lensLabels[filterValue.slice(5)] : current.category;
    $('question').textContent = current.text;
    $('previous').disabled = position === 0;
    $('next').disabled = false;
    $('progress').textContent = `${position + 1} / ${deck.length}`;
    $('followupArea').hidden = !current.followup;
    $('followup').textContent = current.followup || '';
    $('followup').hidden = true;
    $('followupToggle').textContent = '+ Follow-up';
    $('followupToggle').setAttribute('aria-expanded', 'false');
    renderInfo(current);
    const main = document.querySelector('.question-main');
    main.classList.remove('arrive');
    void main.offsetWidth;
    main.classList.add('arrive');
    if (focus) $('question').focus({ preventScroll: true });
  }

  function resetRound(avoidId, focus) {
    newRound(avoidId);
    render(focus);
  }

  function next() {
    if (!deck.length || position >= deck.length - 1) resetRound(current?.id, true);
    else {
      position += 1;
      render(true);
    }
  }

  function previous() {
    if (position > 0) {
      position -= 1;
      render(true);
    }
  }

  function installData(rawQuestions, rawSources) {
    const normalized = (Array.isArray(rawQuestions) ? rawQuestions : []).map(normalize).filter(Boolean);
    questions = normalized;
    sources = Array.isArray(rawSources) ? rawSources : Array.isArray(window.SOURCES) ? window.SOURCES : [];
    updateEdition();
    updateCollections();
    updateCategories();
    filterValue = $('category').value;
    resetRound(current?.id, false);
    if (!questions.length) {
      $('dataStatus').hidden = false;
      $('dataStatus').textContent = 'Question data is not available yet.';
    } else $('dataStatus').hidden = true;
  }

  function chooseCategory() {
    filterValue = $('category').value;
    resetRound(current?.id, false);
  }

  function chooseCollection() {
    updateCategories();
    filterValue = $('category').value;
    resetRound(current?.id, false);
  }

  $('next').addEventListener('click', next);
  $('previous').addEventListener('click', previous);
  $('collection').addEventListener('change', chooseCollection);
  $('category').addEventListener('change', chooseCategory);
  $('followupToggle').addEventListener('click', () => {
    const open = $('followup').hidden;
    $('followup').hidden = !open;
    $('followupToggle').textContent = open ? '− Close follow-up' : '+ Follow-up';
    $('followupToggle').setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.repeat || event.target.closest('button,select,input,textarea,a,[contenteditable]')) return;
    if (event.key === ' ' || event.key === 'ArrowRight') {
      event.preventDefault();
      next();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      previous();
    }
  });

  window.setTwoPerspectivesData = bundle => {
    const value = bundle && Array.isArray(bundle.questions) ? bundle : { questions: bundle, sources: window.SOURCES };
    installData(value.questions, value.sources);
  };
  window.addEventListener('two-perspectives-data', event => {
    if (event.detail) window.setTwoPerspectivesData(event.detail);
  });

  const initial = rawDataCandidate();
  installData(initial.questions, initial.sources);
})();
