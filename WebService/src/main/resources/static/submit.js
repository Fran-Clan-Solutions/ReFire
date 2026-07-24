let mIngredient_list = [];
let mSteps = [""]; // start with one empty step

// Escapes HTML special characters so typed text can never be interpreted
// as markup/script when inserted into the page.
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
    renderSteps();

    $("#ingredient_input").on("keydown", function (e)
    {
        if (e.key === "Enter")
        {
            e.preventDefault();
            addIngredient();
        }
    });
});

// ---- Ingredients ----

function renderIngredientTags()
{
    const tagHTML = mIngredient_list.map((ing, idx) => `
        <span class='badge bg-secondary ingredient-badge'>
            ${escapeHtml(ing)}
            <span class="ms-2 text-light remove-tag" style="cursor:pointer;" data-index="${idx}">&times;</span>
        </span>
    `).join("");
    $("#ingredient_list").html(tagHTML);
}

function addIngredient()
{
    const val = $("#ingredient_input").val().trim().toLowerCase();
    if (!val) return;

    if (mIngredient_list.includes(val))
    {
        $("#ingredient_input").val("");
        return;
    }

    mIngredient_list.push(val);
    $("#ingredient_input").val("");
    renderIngredientTags();
}

$(document).on("click", ".remove-tag", function ()
{
    const idx = $(this).data("index");
    mIngredient_list.splice(idx, 1);
    renderIngredientTags();
});

// ---- Instruction steps ----

function renderSteps()
{
    const html = mSteps.map((step, idx) => `
        <div class="step-row">
            <span class="step-number">${idx + 1}.</span>
            <input type="text" class="form-control step-input" data-index="${idx}" placeholder="Describe this step" value="${escapeHtml(step)}">
            ${mSteps.length > 1 ? `<button type="button" class="btn btn-outline-danger btn-sm remove-step" data-index="${idx}">&times;</button>` : ""}
        </div>
    `).join("");
    $("#steps_container").html(html);
}

$(document).on("input", ".step-input", function ()
{
    const idx = $(this).data("index");
    mSteps[idx] = $(this).val();
});

// Enter adds a new step right after the current one, like a numbered list
// editor - since a plain text input can't hold a literal line break, a new
// step is the equivalent of "a new line" for instructions.
$(document).on("keydown", ".step-input", function (e)
{
    if (e.key === "Enter")
    {
        e.preventDefault();
        const idx = $(this).data("index");
        mSteps[idx] = $(this).val(); // make sure the current edit isn't lost
        mSteps.splice(idx + 1, 0, "");
        renderSteps();
        $(".step-input").eq(idx + 1).trigger("focus");
    }
});

$(document).on("click", ".remove-step", function ()
{
    const idx = $(this).data("index");
    mSteps.splice(idx, 1);
    renderSteps();
});

function addStep()
{
    mSteps.push("");
    renderSteps();
    $(".step-input").last().trigger("focus");
}

// ---- Submission ----

function showAlert(message, type)
{
    $("#formAlert")
        .removeClass("d-none alert-success alert-danger")
        .addClass(`alert-${type}`)
        .text(message);
}

function submitRecipe()
{
    const name = $("#recipe_name").val().trim();
    const mealType = $("#meal_type").val();
    const cookTime = parseInt($("#cook_time").val(), 10);
    const steps = mSteps.map(s => s.trim()).filter(s => s.length > 0);

    if (!name) return showAlert("Please enter a recipe name.", "danger");
    if (!mealType) return showAlert("Please choose a meal type.", "danger");
    if (!cookTime || cookTime <= 0) return showAlert("Please enter a valid cook time.", "danger");
    if (mIngredient_list.length === 0) return showAlert("Please add at least one ingredient.", "danger");
    if (steps.length === 0) return showAlert("Please add at least one instruction step.", "danger");

    const instructions = steps.map((step, idx) => `${idx + 1}. ${step}`).join(" ");

    const payload = {
        name: name,
        mealType: mealType,
        cookTime: cookTime,
        ingredients: mIngredient_list,
        instructions: instructions
    };

    $.ajax({
        url: "/submitRecipe",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function ()
        {
            showAlert("Thanks! Your recipe has been submitted for review.", "success");
            resetForm();
        },
        error: function (xhr)
        {
            const message = xhr.responseText || "Something went wrong submitting your recipe. Please try again.";
            showAlert(message, "danger");
        }
    });
}

function resetForm()
{
    $("#recipe_name").val("");
    $("#meal_type").val("");
    $("#cook_time").val("");
    mIngredient_list = [];
    mSteps = [""];
    renderIngredientTags();
    renderSteps();
}