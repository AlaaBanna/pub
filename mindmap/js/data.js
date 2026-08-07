// Version: v1.0.0 | Updated: 2026-08-07 | Features: Mind Map Data Layer & Node Indexing
// ── UTILITIES ──
const uid = () => Math.random().toString(36).slice(2, 11);
const clone = o => JSON.parse(JSON.stringify(o));
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// ── DATA LAYER ──
function createNode(text = '', order = 0, tags = []) {
    const now = new Date().toISOString();
    return { id: uid(), text, note: '', article: null, completed: false, order, tags: Array.isArray(tags) ? tags : [], created: now, updated: now, children: [] };
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

// O(1) Fast Node Index Map
const nodeIndexMap = new Map();

function rebuildNodeIndex(tree) {
    nodeIndexMap.clear();
    if (!tree) return;
    function index(n, d = 0) {
        if (!n) return;
        n.depth = d;
        nodeIndexMap.set(n.id, n);
        if (n.children) {
            for (let i = 0; i < n.children.length; i++) {
                index(n.children[i], d + 1);
            }
        }
    }
    index(tree, 0);
}

function findNode(tree, id) {
    if (!id) return null;
    if (nodeIndexMap.has(id)) return nodeIndexMap.get(id);
    if (!tree) return null;
    if (tree.id === id) return tree;
    if (tree.children) {
        for (const child of tree.children) {
            const found = findNode(child, id);
            if (found) return found;
        }
    }
    return null;
}

function findParent(tree, id, parent = null) {
    if (!tree) return null;
    if (tree.id === id) return parent;
    if (tree.children) {
        for (const child of tree.children) {
            const found = findParent(child, id, tree);
            if (found) return found;
        }
    }
    return null;
}

function getSortedChildren(node) {
    if (!node || !node.children) return [];
    return [...node.children].sort((a, b) => (a.order || 0) - (b.order || 0));
}

function getDescendantCount(node) {
    if (!node) return 0;
    let count = 0;
    if (node.children) {
        for (const child of node.children) count += 1 + getDescendantCount(child);
    }
    return count;
}

// ── MARKUP SERIALIZATION & PARSING ──
function serializeNode(node, depth = 0) {
    const indent = '  '.repeat(depth);
    const checkPrefix = node.completed ? '[x] ' : '';
    let lines = [`${indent}${node.order ? node.order + '. ' : ''}${checkPrefix}${node.text}`];
    if (node.note) {
        for (const line of node.note.split('\n')) lines.push(`${indent}: ${line}`);
    }
    if (node.article && node.article.content) {
        for (const line of node.article.content.split('\n')) lines.push(`${indent}::article ${line}`);
    }
    for (const child of getSortedChildren(node)) lines.push(...serializeNode(child, depth + 1));
    return lines;
}

function serialize(tree) {
    return serializeNode(tree, 0).join('\n');
}

function parseMarkup(str) {
    if (!str || !str.trim()) return createNode("خريطة جديدة");
    // Normalize literal \t escape sequences if emitted by LLMs/JSON
    const normalizedStr = str.replace(/\\t/g, '\t');
    const lines = normalizedStr.split('\n');
    const dummyRoot = createNode('');
    let currentNoteNode = null;
    const stack = [{ node: dummyRoot, indent: -1 }];

    for (const rawLine of lines) {
        if (!rawLine.trim()) continue;
        const expandedLine = rawLine.replace(/\t/g, '    ');
        const indent = expandedLine.search(/\S/);
        if (indent < 0) continue;

        let text = rawLine.trim();
        if (text.startsWith('::article') || text.startsWith(':: article')) {
            if (currentNoteNode) {
                const articleLine = text.replace(/^::\s*article\s?/, '');
                if (!currentNoteNode.article) {
                    currentNoteNode.article = { content: articleLine, updatedAt: new Date().toISOString() };
                } else {
                    currentNoteNode.article.content += '\n' + articleLine;
                }
            }
            continue;
        }

        if (text.startsWith(': ')) {
            if (currentNoteNode) {
                const noteLine = text.slice(2);
                if (!currentNoteNode.article) {
                    currentNoteNode.article = { content: noteLine, updatedAt: new Date().toISOString() };
                } else {
                    currentNoteNode.article.content += '\n' + noteLine;
                }
            }
            continue;
        }

        let inlineArticle = '';
        if (text.includes(' :: ')) {
            const parts = text.split(' :: ');
            text = parts[0].trim();
            inlineArticle = parts.slice(1).join(' :: ').trim();
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
        if (inlineArticle) {
            newNode.article = { content: inlineArticle, updatedAt: new Date().toISOString() };
        }
        currentNoteNode = newNode;

        while (stack.length > 1 && stack[stack.length - 1].indent >= indent) stack.pop();
        stack[stack.length - 1].node.children.push(newNode);
        stack.push({ node: newNode, indent });
    }

    let resultTree = createNode('خريطة جديدة');
    if (dummyRoot.children.length === 1) resultTree = dummyRoot.children[0];
    else if (dummyRoot.children.length > 0) {
        const wrapper = createNode('Root');
        wrapper.children = dummyRoot.children;
        resultTree = wrapper;
    }
    rebuildNodeIndex(resultTree);
    return resultTree;
}

// ── SAMPLE DATA ──
const DEFAULT_SAMPLE_MARKUP = `الفلسفة
	الميتافيزيقا (فلسفة الوجود)
	::article # الميتافيزيقا (فلسفة الوجود)
	::article دراسة طبيعة الوجود، الواقع، والكون والمبادئ الأولى للمادة والروح.
	::article 
	::article ### المحاور والأنشطة الرئيسية:
	::article 1. **الأنطولوجيا**: البحث في ماهية الوجود الخالص.
	::article 2. **الكوزمولوجيا**: علم الكون وبنيته وقوانينه الكلية.
		الأنطولوجيا (علم الوجود)
		::article البحث في ماهية الوجود الخالص ومكوناته الأساسية وتحليل مقومات الواقع.
			طبيعة الواقع
				المادية
				::article الاعتقاد بأن المادة هي المادة الأساسية الوحيدة في الكون وأن جميع الظواهر ناتجة عن التفاعلات المادية.
					المادية الجدلية
						تطبيقات المادية التاريخية عند كارل ماركس
				المثالية
				::article الاعتقاد بأن العقل أو الروح هما الجوهر الأساسي للواقع وأن العالم الخارجي نتاج الفكر.
					المثالية المطلقة
						فلسفة الروح والديالكتيك عند هيجل
		الكونيات (الكوزمولوجيا)
		::article البحث في أصل الكون وبنيته وقوانينه الكلية وتطور الزمان والمكان.
			الزمان والمكان
				الواقعية الزمانية
					المفهوم المطلق للزمان والمكان عند نيوتن
				النسبية الزمانية
					المفهوم العلاقي للزمان والمكان عند لايبنتز وإينشتاين
	الإبستمولوجيا (نظرية المعرفة)
	::article # الإبستمولوجيا (نظرية المعرفة)
	::article دراسة أصل المعرفة، طبيعتها، حدودها، ووسائل تحصيلها والتمييز بين اليقين والظن.
	::article 
	::article ### التوجهات الفلسفية الكبرى:
	::article - **العقلانية**: الفكر المستقل والمفاهيم الفطرية.
	::article - **التجريبية**: الحواس والملاحظة المباشرة.
		مصادر المعرفة
			العقلانية
			::article التفكير العقلاني المستقل عن الحواس هو المصدر الرئيس للحقائق اليقينية.
				المعرفة الفطرية
					الأفكار المسبقة عند ديكارت
						مبدأ الكوجيتو: "أنا أفكر، إذن أنا موجود"
			التجريبية
			::article الحواس والتجربة المباشرة هما المصدر الوحيد لبناء المعرفة البشرية.
				التأثر الحسي
					مفهوم اللوح الأبيض عند جون لوك
						الانطباعات الحسية الأولية والثانوية
		طبيعة الحقيقة
			نظرية التطابق
			::article الحقيقة هي ما يطابق الواقع الخارجي بالفعل بشكل مباشر.
			نظرية التماسك
			::article الحقيقة هي الاتساق المنطقي داخل مجموعة معتقدات مترابطة.
	الإكسيولوجيا (نظرية القيم)
	::article دراسة القيم وغايات السلوك الإنساني والتقدير الجمالي والأخلاقي.
		الأخلاق (فلسفة الأخلاق)
		::article دراسة المفاهيم المتعلقة بالخير والشر والصواب والخطأ وتأطير السلوك الفردي والجماعي.
			الأخلاق المعيارية
				أخلاق الواجب (الواجباتية)
				::article التركيز على القواعد والواجبات الأخلاقية بصرف النظر عن النتائج والمكاسب.
					الأمر المطلق عند إيمانويل كانت
						صياغة القانون العام للواجب الأخلاقي
				الأخلاق العواقبية
				::article تقييم الأفعال بناءً على نتائجها وآثارها ومقياس المنفعة العامة.
					المذهب النفعي عند جيريمي بنثام وجون ستيوارت مل
						مبدأ تحقيق أكبر قدر من السعادة لأكبر عدد من الناس
		الجماليات (فلسفة الفن)
		::article دراسة طبيعة الجمال والتذوق الفني والابتكار الإبداعي ومعايير التقييم الجمالي.
			طبيعة الحكم الجمالي
				الموضوعية الجمالية
				::article الجمال صفة متأصلة في الموضوع الفني نفسه.
				الذاتية الجمالية
				::article الجمال ذوق فردي يعتمد على إدراك المشاهد وتجربته.
	المنطق
	::article # المنطق والاستدلال
	::article دراسة مبادئ الاستدلال الصحيح والتفكير النقدي وصياغة الحجج المنطقية.
		المنطق الصوري (التقليدي)
		::article التركيز على صورة الحجة وصحتها الهيكلية واستنباط النتائج من المقدمات.
			الاستدلال الاستنباطي
				القياس الأرسطي
					المقدمات والنتائج المنطقية
						قواعد الصدق والصحة في القياس
		المنطق غير الصوري (الرمزي والمعاصر)
		::article تحليل الحجج والتعبير عنها برموز رياضية بدقة واستنتاج الاحتمالات.
			الاستدلال الاستقراء
				التعميم الاستقرائي
					الاستدلال بالاحتمالية والاستشهاد بالأدلة التجريبية`;

// ── LOCAL STORAGE PERSISTENCE ──
const STORAGE_KEY = 'metafikra_mp_tree_v1';

function saveToStorage() {
    try {
        if (!state.tree) return;
        rebuildNodeIndex(state.tree);
        localStorage.setItem(STORAGE_KEY, serializeMT(state.tree));
    } catch(e) {}
}

function loadFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('metafikra_tree');
        if (!raw) return null;
        const mtTree = parseMT(raw);
        if (mtTree) {
            rebuildNodeIndex(mtTree);
            return mtTree;
        }
        const markupTree = parseMarkup(raw);
        if (markupTree) {
            rebuildNodeIndex(markupTree);
            return markupTree;
        }
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

function isArticleRead(id) {
    if (!id) return false;
    try {
        const readSet = JSON.parse(localStorage.getItem('mf_read_articles') || '[]');
        return readSet.includes(id);
    } catch(e) {
        return false;
    }
}

function toggleArticleReadStatus(tree, id) {
    if (!id) return false;
    try {
        let readSet = JSON.parse(localStorage.getItem('mf_read_articles') || '[]');
        const idx = readSet.indexOf(id);
        let isRead = false;
        if (idx !== -1) {
            readSet.splice(idx, 1);
            isRead = false;
        } else {
            readSet.push(id);
            isRead = true;
        }
        localStorage.setItem('mf_read_articles', JSON.stringify(readSet));
        return isRead;
    } catch(e) {
        return false;
    }
}

function setNodeArticle(tree, id, content) {
    const node = findNode(tree, id);
    if (!node) return null;
    if (!content || !content.trim()) {
        node.article = null;
    } else {
        node.article = {
            content: content.trim(),
            updatedAt: new Date().toISOString()
        };
    }
    return node.article;
}