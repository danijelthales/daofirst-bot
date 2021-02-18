$('#rebatesButton').click(function () {
    $('body').css('cursor', 'progress');
    $.ajax({
        url: "/rebates/" + $('#Address').val(), success: function (result) {
            $("#holder").html(result);
            $('body').css('cursor', 'default');
        }
    });
});
