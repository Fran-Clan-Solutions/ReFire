let adminKey = sessionStorage.getItem("refire_admin_key") || "";
let existingRecipeNames = []; // names of already-approved recipes, for clash detection
let pendingSubmissions = [];

// Escapes HTML special characters so submitted text can never be
// interpreted as markup/script when inserted into the page.
function escapeHtml(str)
{
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// Same edit-distance calculation used elsewhere in the app, reused here to
// flag recipe names that are suspiciously close to an existing one.
function levenshteinDistance(a, b)
{
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++)
    {
        for (let j = 1; j <= n; j++)
        {
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    return dp[m][n];
}

// Splits a numbered instructions string ("1. Cook spaghetti. 2. Fry
// bacon...") into individual step strings, same convention used across
// the app's recipe data.
function parseInstructionSteps(instructions)
{
    return (instructions || "")
        .split(/\d+\.\s*/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
}

// Checks a candidate recipe name against existing approved recipe names.
// Returns { type: "exact"|"similar", match } or null if there's no clash.
function findNameClash(candidateName, existingNames)
{
    const candidate = candidateName.trim().toLowerCase();
    if (!candidate || existingNames.length === 0) return null;

    const exactMatch = existingNames.find(n => n.toLowerCase() === candidate);
    if (exactMatch) return { type: "exact", match: exactMatch };

    let closest = null;
    let closestDistance = Infinity;
    existingNames.forEach(n =>
    {
        const distance = levenshteinDistance(candidate, n.toLowerCase());
        if (distance < closestDistance)
        {
            closestDistance = distance;
            closest = n;
        }
    });

    const maxDistance = Math.max(2, Math.floor(candidate.length * 0.2));
    if (closest && closestDistance <= maxDistance)
    {
        return { type: "similar", match: closest };
    }
    return null;
}

// Appends " (2)", " (3)", etc. until the name no longer clashes with
// anything in existingNamesLower.
function suggestUniqueName(base, existingNamesLower)
{
    let candidate = base;
    let n = 2;
    while (existingNamesLower.includes(candidate.toLowerCase()))
    {
        candidate = `${base} (${n})`;
        n++;
    }
    return candidate;
}

$(document).ready(function ()
{
    if (adminKey)
    {
        tryUnlock(adminKey);
    }

    $("#unlockBtn").on("click", function ()
    {
        const key = $("#admin_key_input").val().trim();
        if (!key) return;
        tryUnlock(key);
    });

    $("#admin_key_input").on("keydown", function (e)
    {
        if (e.key === "Enter")
        {
            e.preventDefault();
            $("#unlockBtn").trigger("click");
        }
    });

    $("#lockBtn").on("click", function ()
    {
        sessionStorage.removeItem("refire_admin_key");
        adminKey = "";
        location.reload();
    });
});

function tryUnlock(key)
{
    $.ajax({
        url: "/admin/pending",
        headers: { "X-Admin-Key": key },
        success: function (pending)
        {
            adminKey = key;
            sessionStorage.setItem("refire_admin_key", key);
            pendingSubmissions = pending || [];
            $("#lockScreen").addClass("d-none");
            $("#adminContent").removeClass("d-none");
            loadExistingRecipeNames(renderPending);
        },
        error: function (xhr)
        {
            $("#unlockError")
                .removeClass("d-none")
                .text(xhr.status === 401 ? "Invalid admin key." : "Something went wrong. Please try again.");
        }
    });
}

function loadExistingRecipeNames(callback)
{
    $.ajax({
        url: "/search",
        success: function (recipes)
        {
            existingRecipeNames = (recipes || []).map(r => r.name);
            callback();
        },
        error: function ()
        {
            existingRecipeNames = [];
            callback();
        }
    });
}

function renderPending()
{
    $("#pendingCount").text(pendingSubmissions.length);

    if (pendingSubmissions.length === 0)
    {
        $("#pendingList").html(`<p class="text-center py-5 mb-0">No pending submissions. 🎉</p>`);
        return;
    }

    const html = pendingSubmissions.map(renderCard).join("");
    $("#pendingList").html(html);
}

function renderCard(sub)
{
    const clash = findNameClash(sub.name, existingRecipeNames);
    const steps = parseInstructionSteps(sub.instructions);
    const submittedDate = sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : "";

    const suggestedName = clash && clash.type === "exact"
        ? suggestUniqueName(sub.name, existingRecipeNames.map(n => n.toLowerCase()))
        : sub.name;

    const clashWarning = clash ? `
        <div class="alert ${clash.type === "exact" ? "alert-danger" : "alert-warning"} py-2 px-3 mb-2 small">
            ${clash.type === "exact"
                ? `⚠️ A recipe named "<strong>${escapeHtml(clash.match)}</strong>" already exists. The name below has been adjusted — edit it if you'd prefer something else.`
                : `A similar recipe "<strong>${escapeHtml(clash.match)}</strong>" already exists. Worth a quick check before approving.`}
        </div>
    ` : "";

    return `
        <div class="card mb-3 submission-card" data-id="${sub.id}">
            <div class="card-body">
                ${clashWarning}
                <div class="d-flex justify-content-between align-items-start mb-2 gap-2">
                    <input type="text" class="form-control form-control-lg fw-bold recipe-name-input border-0 px-0" value="${escapeHtml(suggestedName)}">
                    <span class="badge bg-primary text-nowrap mt-2">${escapeHtml(sub.mealType)}</span>
                </div>
                <p class="small mb-3">Cook time: ${sub.cookTime} min${submittedDate ? ` &middot; Submitted ${submittedDate}` : ""}</p>

                <p class="mb-1"><strong>Ingredients:</strong></p>
                <ul class="mb-3">
                    ${sub.ingredients.map(i => `<li>${escapeHtml(i)}</li>`).join("")}
                </ul>

                <p class="mb-1"><strong>Instructions:</strong></p>
                <ol class="mb-3">
                    ${steps.map(s => `<li>${escapeHtml(s)}</li>`).join("")}
                </ol>

                <div class="d-flex gap-2">
                    <button type="button" class="btn btn-success btn-sm approve-btn">Approve</button>
                    <button type="button" class="btn btn-outline-danger btn-sm reject-btn">Reject</button>
                </div>
            </div>
        </div>
    `;
}

$(document).on("click", ".approve-btn", function ()
{
    const $card = $(this).closest(".submission-card");
    const id = $card.data("id");
    const sub = pendingSubmissions.find(s => s.id === id);
    const newName = $card.find(".recipe-name-input").val().trim();

    if (!newName)
    {
        alert("Recipe name can't be empty.");
        return;
    }

    // Final safety check in case the admin typed something that still clashes
    if (existingRecipeNames.some(n => n.toLowerCase() === newName.toLowerCase()))
    {
        alert(`"${newName}" already exists. Please choose a different name.`);
        return;
    }

    const payload = {
        name: newName,
        mealType: sub.mealType,
        cookTime: sub.cookTime,
        ingredients: sub.ingredients,
        instructions: sub.instructions
    };

    $.ajax({
        url: `/admin/approve/${id}`,
        method: "POST",
        contentType: "application/json",
        headers: { "X-Admin-Key": adminKey },
        data: JSON.stringify(payload),
        success: function (savedRecipe)
        {
            existingRecipeNames.push(savedRecipe.name);
            pendingSubmissions = pendingSubmissions.filter(s => s.id !== id);
            renderPending();
        },
        error: function (xhr)
        {
            alert(xhr.responseText || "Failed to approve recipe.");
        }
    });
});

$(document).on("click", ".reject-btn", function ()
{
    const $card = $(this).closest(".submission-card");
    const id = $card.data("id");

    if (!confirm("Reject this submission? This can't be undone.")) return;

    $.ajax({
        url: `/admin/reject/${id}`,
        method: "DELETE",
        headers: { "X-Admin-Key": adminKey },
        success: function ()
        {
            pendingSubmissions = pendingSubmissions.filter(s => s.id !== id);
            renderPending();
        },
        error: function (xhr)
        {
            alert(xhr.responseText || "Failed to reject submission.");
        }
    });
});