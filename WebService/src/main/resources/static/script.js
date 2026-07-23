let mIngredient_list = []
let knownIngredients = new Set(); // vocabulary of every ingredient used across all recipes

// Standard edit-distance calculation, used to find the closest known
// ingredient to whatever the user typed (catches simple typos).
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

// Rough English pluralization stripper - not perfect, just good enough to
// try as a first guess before falling back to fuzzy matching.
function singularize(word) 
{
    if (word.endsWith('ies') && word.length > 4) return word.slice(0, -3) + 'y';
    if (word.endsWith('es') && word.length > 3) return word.slice(0, -2);
    if (word.endsWith('s') && !word.endsWith('ss') && word.length > 3) return word.slice(0, -1);
    return word;
}

// Attempts to correct a user-typed ingredient to match the app's known
// ingredient vocabulary, so typos ("tomatoe") and singular/plural mismatches
// ("eggs") still find the right recipes. Falls back to the original input
// unchanged if nothing close enough is found (so genuinely new ingredients
// aren't mangled).
function normalizeIngredient(rawValue, vocabulary) 
{
    const value = rawValue.trim().toLowerCase();
    if (!value || vocabulary.size === 0) return value;
    if (vocabulary.has(value)) return value;

    const singular = singularize(value);
    if (vocabulary.has(singular)) return singular;

    let bestMatch = null;
    let bestDistance = Infinity;
    const maxDistance = value.length <= 4 ? 1 : 2; // tighter budget for short words

    vocabulary.forEach(known => 
    {
        const distance = levenshteinDistance(value, known);
        if (distance < bestDistance) 
        {
            bestDistance = distance;
            bestMatch = known;
        }
    });

    return (bestMatch && bestDistance <= maxDistance) ? bestMatch : value;
}

// Escapes HTML special characters so user-typed ingredient text can never
// be interpreted as markup/script when inserted into the page.
function escapeHtml(str) 
{
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// Renders the ingredient tags from mIngredient_list. Single source of truth
// for what's on screen, used both when restoring ingredients (e.g. coming
// back from the recipes page) and when adding a new one.
function renderIngredientTags() 
{
    const tagHTML = mIngredient_list.map(i => `
        <span class='badge bg-secondary ingredient-badge me-2 mb-2'>
            ${escapeHtml(i)}
            <span class="ms-2 text-light remove-tag" style="cursor:pointer;" data-ingredient="${escapeHtml(i)}">&times;</span>
        </span>
    `).join("");
    $("#ingredient_list").html(tagHTML);
}

function updateClearButtonVisibility() 
{
    if (mIngredient_list.length > 0) 
    {
        $("#ingredient_header").show();
        $("#clear_button_container").show();
    } 
    else 
    {
        $("#ingredient_header").hide();
        $("#clear_button_container").hide();
    }
}

// Restore any ingredients carried back from the recipes page (via "Back to
// Search"), then wire up the Enter-to-add behavior.
$(document).ready(function() 
{
    const params = new URLSearchParams(window.location.search);
    params.getAll("ingredient_list").forEach(i => 
    {
        const lower = i.toLowerCase();
        if (lower && !mIngredient_list.includes(lower)) 
        {
            mIngredient_list.push(lower);
        }
    });
    renderIngredientTags();
    updateClearButtonVisibility();

    // Quietly fetch all recipes to build the known-ingredient vocabulary,
    // used to correct typos/plurals as ingredients get added below. Nothing
    // is displayed here - recipes only show up on the recipes page.
    $.ajax({
        url: "/search",
        success: function (recipes) 
        {
            (recipes || []).forEach(r => r.ingredients.forEach(i => knownIngredients.add(i.toLowerCase())));
        }
    });

    $("#ingredient_input").on("keydown", function(e) 
    {
        if (e.key === "Enter") 
        {
            e.preventDefault(); // stop form from submitting
            addIngredient();
        }
        else if (e.key === "Escape") 
        {
            hideSuggestions();
        }
    });

    // Autocomplete: show matching known ingredients as the user types
    $("#ingredient_input").on("input", function() 
    {
        renderSuggestions($(this).val());
    });

    $("#ingredient_input").on("focus", function() 
    {
        if ($(this).val().trim()) renderSuggestions($(this).val());
    });

    // Clicking a suggestion adds it immediately
    $(document).on("click", ".suggestion-item", function() 
    {
        $("#ingredient_input").val($(this).text());
        addIngredient();
    });

    // Click anywhere outside the input/dropdown closes it
    $(document).on("click", function(e) 
    {
        if (!$(e.target).closest("#ingredient_input, #ingredient_suggestions").length) 
        {
            hideSuggestions();
        }
    });
});

// Shows up to 6 known ingredients matching the current input, prioritizing
// ones that start with the typed text over ones that merely contain it.
// Ingredients already added are excluded.
function renderSuggestions(rawQuery) 
{
    const query = rawQuery.trim().toLowerCase();
    if (query.length < 2) 
    {
        hideSuggestions();
        return;
    }

    const matches = Array.from(knownIngredients)
        .filter(ing => ing.includes(query) && !mIngredient_list.includes(ing))
        .sort((a, b) => a.indexOf(query) - b.indexOf(query) || a.localeCompare(b))
        .slice(0, 6);

    if (matches.length === 0) 
    {
        hideSuggestions();
        return;
    }

    const html = matches
        .map(m => `<button type="button" class="list-group-item list-group-item-action suggestion-item">${escapeHtml(m)}</button>`)
        .join("");
    $("#ingredient_suggestions").html(html).show();
}

function hideSuggestions() 
{
    $("#ingredient_suggestions").hide().empty();
}

// Remove individual tag when X is clicked
$(document).on("click", ".remove-tag", function() 
{
    const ingredient = $(this).data("ingredient");

    // Remove from array and re-render so the DOM always matches mIngredient_list
    mIngredient_list = mIngredient_list.filter(item => item !== ingredient);
    renderIngredientTags();

    updateClearButtonVisibility();
});

function addIngredient() 
{
    var raw = $("#ingredient_input").val().trim().toLowerCase();

    if (!raw) return; // ignore empty input

    var mIngredient = normalizeIngredient(raw, knownIngredients);

    $.ajax(
    {
        url: "/addIngredient?ingredient=" + encodeURIComponent(mIngredient),
        success: function(res) 
        {
            if (res !== "") 
            {
                // Add tag
                if (!mIngredient_list.includes(mIngredient))
                {
                    mIngredient_list.push(mIngredient);
                    renderIngredientTags();

                    $("#ingredient_input").val(""); // clear input
                    hideSuggestions();
                    console.log(res + " appended");
                    updateClearButtonVisibility();
                }
            }
        }
    });
}

function clearIngredients()
{
    mIngredient_list = [];
    renderIngredientTags();
    updateClearButtonVisibility();
}

function search() 
{
    const params = new URLSearchParams();
    mIngredient_list.forEach(i => params.append("ingredient_list", i));

    // Navigate to recipes.html with query params
    window.location.href = `recipes.html?${params.toString()}`;
}