// Version: v4.1.0 | Updated: 2026-07-31 18:49 | Features: Support inline ':: Note text' parsing in parseMarkup
// ── UTILITIES ──
const uid = () => Math.random().toString(36).slice(2, 11);
const clone = o => JSON.parse(JSON.stringify(o));
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// ── DATA LAYER ──
function createNode(text = '', order = 0, tags = []) {
    const now = new Date().toISOString();
    return { id: uid(), text, note: '', completed: false, order, tags: Array.isArray(tags) ? tags : [], created: now, updated: now, children: [] };
}

// ── CUSTOM .MT FORMAT SERIALIZATION & PARSING ──
function serializeMT(tree) {
    const now = new Date().toISOString();
    return JSON.stringify({
        "$schema": "https://metafikra.pub/schema/v1.json",
        "format": "metafikra-mindmap",
        "version": "1.0.0",
        "meta": {
            "title": tree && tree.text ? tree.text : "Mind Map",
            "author": "User",
            "created": tree && tree.created ? tree.created : now,
            "updated": now,
            "tags": tree && tree.tags ? tree.tags : []
        },
        "tree": tree
    }, null, 2);
}

function parseMT(jsonString) {
    try {
        const data = JSON.parse(jsonString);
        if (data && data.tree) return data.tree;
        if (data && data.id && data.children) return data;
    } catch(e) {}
    return null;
}

function countSubtreeDescendants(node) {
    if (!node || !node.children || node.children.length === 0) return 0;
    let count = 0;
    for (const child of node.children) {
        count += 1 + countSubtreeDescendants(child);
    }
    return count;
}

function findNode(tree, id) {
    if (!tree) return null;
    if (tree.id === id) return tree;
    for (const child of tree.children) {
        const found = findNode(child, id);
        if (found) return found;
    }
    return null;
}

function findParent(tree, id, parent = null) {
    if (!tree) return null;
    if (tree.id === id) return parent;
    for (const child of tree.children) {
        const found = findParent(child, id, tree);
        if (found) return found;
    }
    return null;
}

function getSortedChildren(node) {
    if (!node) return [];
    return [...node.children].sort((a, b) => a.order - b.order);
}

function getDescendantCount(node) {
    if (!node) return 0;
    let count = 0;
    for (const child of node.children) count += 1 + getDescendantCount(child);
    return count;
}

// ── SERIALIZATION ──
function serializeNode(node, depth = 0) {
    const indent = '  '.repeat(depth);
    const checkPrefix = node.completed ? '[x] ' : '';
    let lines = [`${indent}${node.order ? node.order + '. ' : ''}${checkPrefix}${node.text}`];
    if (node.note) {
        for (const line of node.note.split('\n')) lines.push(`${indent}: ${line}`);
    }
    for (const child of getSortedChildren(node)) lines.push(...serializeNode(child, depth + 1));
    return lines;
}

function serialize(tree) {
    return serializeNode(tree, 0).join('\n');
}

function parseMarkup(str) {
    const lines = str.split('\n');
    const dummyRoot = createNode('');
    let currentNoteNode = null;
    const stack = [{ node: dummyRoot, indent: -1 }];

    for (const rawLine of lines) {
        if (!rawLine.trim()) continue;
        const line = rawLine.replace(/\t/g, '  ');
        const indent = line.search(/\S/);
        if (indent < 0) continue;

        let text = line.trim();
        if (text.startsWith(': ')) {
            if (currentNoteNode) currentNoteNode.note += (currentNoteNode.note ? '\n' : '') + text.slice(2);
            continue;
        }

        let inlineNote = '';
        if (text.includes(' :: ')) {
            const parts = text.split(' :: ');
            text = parts[0].trim();
            inlineNote = parts.slice(1).join(' :: ').trim();
        }

        let isCompleted = false;
        if (/^\[[xX]\]\s*/.test(text)) {
            isCompleted = true;
            text = text.replace(/^\[[xX]\]\s*/, '');
        }

        let order = 0;
        const orderMatch = text.match(/^(\d+)\.\s*/);
        if (orderMatch) {
            order = parseInt(orderMatch[1], 10);
            text = text.slice(orderMatch[0].length);
        }

        const newNode = createNode(text, order);
        newNode.completed = isCompleted;
        if (inlineNote) newNode.note = inlineNote;
        currentNoteNode = newNode;

        while (stack.length > 1 && stack[stack.length - 1].indent >= indent) stack.pop();
        stack[stack.length - 1].node.children.push(newNode);
        stack.push({ node: newNode, indent });
    }

    if (dummyRoot.children.length === 1) return dummyRoot.children[0];
    if (dummyRoot.children.length > 0) {
        const wrapper = createNode('Root');
        wrapper.children = dummyRoot.children;
        return wrapper;
    }
    return createNode('New Map');
}

// ── LOCAL STORAGE ──
function saveToStorage() {
    try { localStorage.setItem('metafikra_tree', serialize(state.tree)); } catch (e) { }
}

function loadFromStorage() {
    try {
        const data = localStorage.getItem('metafikra_tree');
        if (data) return parseMarkup(data);
    } catch (e) { }
    return null;
}

// ── SAMPLE DATA ──
const DEFAULT_SAMPLE_MARKUP = `الفلسفة
	الميتافيزيقا (فلسفة الوجود)
	: دراسة طبيعة الوجود، الواقع، والكون
		الأنطولوجيا (علم الوجود)
		: البحث في ماهية الوجود الخالص ومكوناته الأساسية
			طبيعة الواقع
				المادية
				: الاعتقاد بأن المادة هي المادة الأساسية الوحيدة في الكون
					المادية الجدلية
						تطبيقات المادية التاريخية عند كارل ماركس
				المثالية
				: الاعتقاد بأن العقل أو الروح هما الجوهر الأساسي للواقع
					المثالية المطلقة
						فلسفة الروح والديالكتيك عند هيجل
		الكونيات (الكوزمولوجيا)
		: البحث في أصل الكون وبنيته وقوانينه الكلية
			الزمان والمكان
				الواقعية الزمانية
					المفهوم المطلق للزمان والمكان عند نيوتن
				النسبية الزمانية
					المفهوم العلاقي للزمان والمكان عند لايبنتز وإينشتاين
	الإبستمولوجيا (نظرية المعرفة)
	: دراسة أصل المعرفة، طبيعتها، حدودها، ووسائل تحصيلها
		مصادر المعرفة
			العقلانية
			: التفكير العقلاني المستقل عن الحواس هو المصدر الرئيس للحقائق
				المعرفة الفطرية
					الأفكار المسبقة عند ديكارت
						مبدأ الكوجيتو: "أنا أفكر، إذن أنا موجود"
			التجريبية
			: الحواس والتجربة المباشرة هما المصدر الوحيد للمعرفة
				التأثر الحسي
					مفهوم اللوح الأبيض عند جون لوك
						الانطباعات الحسية الأولية والثانوية
		طبيعة الحقيقة
			نظرية التطابق
			: الحقيقة هي ما يطابق الواقع الخارجي بالفعل
			نظرية التماسك
			: الحقيقة هي الاتساق المنطقي داخل مجموعة معتقدات مترابطة
	الإكسيولوجيا (نظرية القيم)
	: دراسة القيم وغايات السلوك الإنساني والتقدير الجمالي
		الأخلاق (فلسفة الأخلاق)
		: دراسة المفاهيم المتعلقة بالخير والشر والصواب والخطأ
			الأخلاق المعيارية
				أخلاق الواجب (الواجباتية)
				: التركيز على القواعد والواجبات الأخلاقية بصرف النظر عن النتائج
					الأمر المطلق عند إيمانويل كانت
						صياغة القانون العام للواجب الأخلاقي
				الأخلاق العواقبية
				: تقييم الأفعال بناءً على نتائجها وآثارها
					المذهب النفعي عند جيريمي بنثام وجون ستيوارت مل
						مبدأ تحقيق أكبر قدر من السعادة لأكبر عدد من الناس
		الجماليات (فلسفة الفن)
		: دراسة طبيعة الجمال والتذوق الفني والابتكار الإبداعي
			طبيعة الحكم الجمالي
				الموضوعية الجمالية
				: الجمال صفة متأصلة في الموضوع الفني نفسه
				الذاتية الجمالية
				: الجمال ذوق فردي يعتمد على إدراك المشاهد وتجربته
	المنطق
	: دراسة مبادئ الاستدلال الصحيح والتفكير النقدي
		المنطق الصوري (التقليدي)
		: التركيز على صورة الحجة وصحتها الهيكلية
			الاستدلال الاستنباطي
				القياس الأرسطي
					المقدمات والنتائج المنطقية
						قواعد الصدق والصحة في القياس
		المنطق غير الصوري (الرمزي والمعاصر)
		: تحليل الحجج والتعبير عنها برموز رياضية بدقة
			الاستدلال الاستقراء
				التعميم الاستقرائي
					الاستدلال بالاحتمالية والاستشهاد بالأدلة التجريبية`;

// ── LOCAL STORAGE PERSISTENCE ──
const STORAGE_KEY = 'metafikra_mp_tree_v1';

function saveToStorage() {
    try {
        if (!state.tree) return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tree));
    } catch(e) {}
}

function loadFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (parsed && parsed.id && parsed.children) return parsed;
    } catch(e) {}
    return null;
}

function toggleNodeCompletion(tree, id) {
    const node = findNode(tree, id);
    if (node) {
        node.completed = !node.completed;
        return node.completed;
    }
    return false;
}

function getCompletionStats(node) {
    if (!node) return { total: 0, completed: 0, percentage: 0 };
    let total = 0, completed = 0;
    function traverse(n) {
        total++;
        if (n.completed) completed++;
        if (n.children) n.children.forEach(traverse);
    }
    traverse(node);
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
}