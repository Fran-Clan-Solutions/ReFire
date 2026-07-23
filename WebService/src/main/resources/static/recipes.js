let allRecipes = [];
let mIngredient_list = [];
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

function buildKnownIngredients(recipes) 
{
    const set = new Set();
    recipes.forEach(r => r.ingredients.forEach(i => set.add(i.toLowerCase())));
    return set;
}

// Escapes HTML special characters so user-typed ingredient text (and, as a
// defense-in-depth measure, recipe data) can never be interpreted as
// markup/script when inserted into the page.
function escapeHtml(str) 
{
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// Splits a recipe's instructions string (e.g. "1. Cook spaghetti. 2. Fry
// bacon...") into an array of individual step strings, with the numbering
// stripped since the <ol> renders its own numbers.
function parseInstructionSteps(instructions) 
{
    return instructions
        .split(/\d+\.\s*/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
}

$(document).ready(function () 
{
    const params = new URLSearchParams(window.location.search);
    mIngredient_list = params.getAll("ingredient_list").map(i => i.toLowerCase());

    fetchRecipes();

    $('.meal-filter').on('change', renderRecipes);

    $('#ingredient_input').on('keydown', function (e) 
    {
        if (e.key === "Enter") {
            e.preventDefault();
            addIngredient();
        }
        else if (e.key === "Escape") 
        {
            hideSuggestions();
        }
    });

    // Autocomplete: show matching known ingredients as the user types
    $('#ingredient_input').on('input', function () 
    {
        renderSuggestions($(this).val());
    });

    $('#ingredient_input').on('focus', function () 
    {
        if ($(this).val().trim()) renderSuggestions($(this).val());
    });

    // Clicking a suggestion adds it immediately
    $(document).on("click", ".suggestion-item", function () 
    {
        $('#ingredient_input').val($(this).text());
        addIngredient();
    });

    // Click anywhere outside the input/dropdown closes it
    $(document).on("click", function (e) 
    {
        if (!$(e.target).closest("#ingredient_input, #ingredient_suggestions").length) 
        {
            hideSuggestions();
        }
    });

    // Remove ingredient on 'X' click
    $(document).on("click", ".remove-tag", function () 
    {
        const ingredient = $(this).data("ingredient").toLowerCase();
        mIngredient_list = mIngredient_list.filter(i => i !== ingredient);
        renderIngredientTags();
        renderRecipes();
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

// Render interactive ingredient tags, and show/hide the Clear All button
// to match. Called any time mIngredient_list changes, so this is the one
// place that keeps both in sync.
function renderIngredientTags() 
{
    const tagHTML = mIngredient_list.map(i => `
        <span class='badge bg-secondary ingredient-badge me-2 mb-2'>
            ${escapeHtml(i)}
            <span class="ms-2 text-light remove-tag" style="cursor:pointer;" data-ingredient="${escapeHtml(i)}">&times;</span>
        </span>
    `).join("");
    $("#ingredient_list").html(tagHTML);

    $("#clear_button_container").toggle(mIngredient_list.length > 0);
}

function clearIngredients() 
{
    mIngredient_list = [];
    renderIngredientTags();
    renderRecipes();
}

// Add ingredient from input
function addIngredient() 
{
    const raw = $('#ingredient_input').val().trim().toLowerCase();
    if (!raw) return;

    const inputVal = normalizeIngredient(raw, knownIngredients);
    if (mIngredient_list.includes(inputVal)) 
    {
        $('#ingredient_input').val('');
        hideSuggestions();
        return;
    }

    mIngredient_list.push(inputVal);
    $('#ingredient_input').val('');
    hideSuggestions();
    renderIngredientTags();
    renderRecipes();
}

// Fetch the full recipe set once. All ingredient/meal-type filtering happens
// client-side in renderRecipes(), so adding or removing ingredients on this
// page never needs another round trip to the server.
function fetchRecipes() 
{
    $.ajax({
        url: "/search",
        success: function (recipes) 
        {
            allRecipes = recipes || [];
            knownIngredients = buildKnownIngredients(allRecipes);

            // Correct any ingredients that arrived via URL (e.g. a shared link,
            // or typed on index.html before the vocabulary was available there).
            mIngredient_list = mIngredient_list.map(i => normalizeIngredient(i, knownIngredients));

            renderIngredientTags();
            renderRecipes();
        },
        error: function () 
        {
            $("#recipes_list").html("<p class='text-danger'>Couldn't load recipes. Please try refreshing the page.</p>");
        }
    });
}

function renderRecipes() 
{
    const userIngredients = mIngredient_list;

    const selectedFilters = $('.meal-filter:checked')
        .map(function () { return this.value.toUpperCase(); })
        .get();

    // Decorate each recipe with its match count up front, so sorting and
    // the on-screen badge both use the same number instead of recomputing it.
    let filteredRecipes = allRecipes.map(recipe => ({
        recipe,
        matchCount: recipe.ingredients.filter(ing => userIngredients.includes(ing.toLowerCase())).length
    }));

    // Filter by ingredients: keep recipes matching at least one ingredient
    // the user has on hand. If no ingredients are entered, show everything.
    if (userIngredients.length > 0) 
    {
        filteredRecipes = filteredRecipes.filter(({ matchCount }) => matchCount > 0);
    }

    // Filter by meal type
    if (selectedFilters.length > 0) 
    {
        filteredRecipes = filteredRecipes.filter(({ recipe }) =>
            selectedFilters.includes(recipe.mealType.toUpperCase()));
    }

    // Sort: by number of matches (desc), then by cook time (asc)
    filteredRecipes.sort((a, b) => 
    {
        if (b.matchCount !== a.matchCount) 
        {
            return b.matchCount - a.matchCount;
        }
        return a.recipe.cookTime - b.recipe.cookTime;
    });

    let html = "";

    if (filteredRecipes.length === 0) 
    {
        html = "<p>No recipes found.</p>";
    } else {
        if (userIngredients.length === 0) 
        {
            html += "<p class='text-secondary-emphasis small'>No ingredients entered — showing all recipes.</p>";
        }
        html += "<ul class='list-unstyled'>";
        filteredRecipes.forEach(({ recipe, matchCount }, index) => 
        {
            const totalIngredients = recipe.ingredients.length;
            const matchBadge = userIngredients.length > 0
                ? `<span class="badge ${matchCount === totalIngredients ? 'bg-success' : 'bg-secondary'} ms-2">${matchCount}/${totalIngredients} ingredients</span>`
                : "";

            html += `
                <li class="mb-3 border-bottom pb-2">
                    <div class="recipe-header" style="cursor: pointer;" data-index="${index}">
                        <strong>${escapeHtml(recipe.name)}</strong>${matchBadge}<br>
                        Time: ${recipe.cookTime} minutes
                    </div>
                </li>`;
        });
        html += "</ul>";
    }

    $("#recipes_list").html(html);

    $(".recipe-header").on("click", function () 
    {
        const index = $(this).data("index");
        const recipe = filteredRecipes[index].recipe;

        const highlightedIngredients = recipe.ingredients.map(ing => 
        {
            if (userIngredients.includes(ing.toLowerCase()))
            {
                return `<li><span class="highlight-ingredient">${escapeHtml(ing)}</span></li>`;
            }
            return `<li>${escapeHtml(ing)}</li>`;
        });

        const instructionSteps = parseInstructionSteps(recipe.instructions)
            .map(step => `<li>${escapeHtml(step)}</li>`);

        $("#recipeDetailContent").html(`
            <h4 class="text-danger">Recipe: <span class="text-primary">${escapeHtml(recipe.name)}</span></h4>
            <p><strong>Cook Time:</strong> ${recipe.cookTime} minutes</p>
            <p class="mb-1"><strong>Ingredients:</strong></p>
            <ul class="mb-3">${highlightedIngredients.join("")}</ul>
            <p class="mb-1"><strong>Instructions:</strong></p>
            <ol>${instructionSteps.join("")}</ol>
        `);

        $("#recipeDetailPanel").addClass("open");
    });

    $("#closePanel").on("click", function () {
        $("#recipeDetailPanel").removeClass("open");
    });
}

function backToSearch() 
{
    const params = new URLSearchParams();
    mIngredient_list.forEach(i => params.append("ingredient_list", i));

    window.location.href = `index.html?${params.toString()}`;
}