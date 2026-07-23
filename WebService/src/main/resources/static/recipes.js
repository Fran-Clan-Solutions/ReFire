let allRecipes = [];
let mIngredient_list = [];

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

$(document).ready(function () 
{
    const params = new URLSearchParams(window.location.search);
    mIngredient_list = params.getAll("ingredient_list").map(i => i.toLowerCase());

    renderIngredientTags();
    fetchRecipes();

    $('.meal-filter').on('change', renderRecipes);

    $('#ingredient_input').on('keydown', function (e) 
    {
        if (e.key === "Enter") {
            e.preventDefault();
            addIngredient();
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

// Render interactive ingredient tags
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

// Add ingredient from input
function addIngredient() 
{
    const inputVal = $('#ingredient_input').val().trim().toLowerCase();
    if (!inputVal || mIngredient_list.includes(inputVal)) return;

    mIngredient_list.push(inputVal);
    $('#ingredient_input').val('');
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

    let filteredRecipes = allRecipes;

    // Filter by ingredients: keep recipes matching at least one ingredient
    // the user has on hand. If no ingredients are entered, show everything.
    if (userIngredients.length > 0) 
    {
        filteredRecipes = filteredRecipes.filter(recipe =>
            recipe.ingredients.some(ing => userIngredients.includes(ing.toLowerCase())));
    }

    // Filter by meal type
    if (selectedFilters.length > 0) 
    {
        filteredRecipes = filteredRecipes.filter(recipe =>
            selectedFilters.includes(recipe.mealType.toUpperCase()));
    }

    // Sort: by number of matches (desc), then by cook time (asc)
    filteredRecipes.sort((a, b) => 
    {
        const aMatches = a.ingredients.filter(ing => userIngredients.includes(ing.toLowerCase())).length;
        const bMatches = b.ingredients.filter(ing => userIngredients.includes(ing.toLowerCase())).length;

        if (bMatches !== aMatches) 
        {
            return bMatches - aMatches;
        }
        return a.cookTime - b.cookTime;
    });

    let html = "";

    if (filteredRecipes.length === 0) 
    {
        html = "<p>No recipes found.</p>";
    } else {
        html = "<ul class='list-unstyled'>";
        filteredRecipes.forEach((recipe, index) => 
        {
            html += `
                <li class="mb-3 border-bottom pb-2">
                    <div class="recipe-header" style="cursor: pointer;" data-index="${index}">
                        <strong>${escapeHtml(recipe.name)}</strong><br>
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
        const recipe = filteredRecipes[index];

        const highlightedIngredients = recipe.ingredients.map(ing => 
        {
            if (userIngredients.includes(ing.toLowerCase()))
            {
                return `<span class="highlight-ingredient">${escapeHtml(ing)}</span>`;
            }
            return escapeHtml(ing);
        });

        $("#recipeDetailContent").html(`
            <h4 class="text-danger">Recipe: <span class="text-primary">${escapeHtml(recipe.name)}</span></h4>
            <p><strong>Cook Time:</strong> ${recipe.cookTime} minutes</p>
            <p><strong>Ingredients:</strong><br> ${highlightedIngredients.join(", ")}</p>
            <p><strong>Instructions:</strong><br> ${escapeHtml(recipe.instructions)}</p>
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