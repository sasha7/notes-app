(function ($) {
  $(document).ready(function () {
    $('[data-toggle="checkbox"]').radiocheck();
    $('[data-toggle="radio"]').radiocheck();

    var pathName = window.location.pathname.split('/');

    if (pathName[1] === 'notes') {
      registerSocketIo('notes');
    }

  });

  var registerSocketIo = function (room) {
    var socket = io('/' + room);

    socket.on('connect', function () {
      console.log('user connected to socket.io');
    });

    socket.on('refresh-list', function (data) {
      var notesList = $('#notes-list');
      var notes = data.list;
      notesList.empty();

      var template = '';
      for (var i = 0; i < notes.length; i++) {
        var note = notes[i];
        template += '<li class="list-group-item"><a href="/notes/' + note.id + '">' + note.title + '</a></li>';
      }

      notesList.append(template);

    });
  }
})(jQuery);
