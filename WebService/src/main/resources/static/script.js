function addIngredient()
{
    var mIngredient = $("#ingredient_input").val();

    $.ajax
    ({
        url:"http://localhost:8080/search?ingredient=" + mIngredient
    })
    .then(function(data)
    {
        $("#ingredient_list").text(data);
    });
}       