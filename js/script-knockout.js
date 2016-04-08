ko.observable.fn.increment = function (value) {
    this(this() + (value || 1));
};

Array.prototype.shuffle  = function(){
    var j, x, i;
    var res = this.slice();
    for (i = this.length; i; i -= 1) {
        j = Math.floor(Math.random() * i);
        x = res[i - 1];
        res[i - 1] = res[j];
        res[j] = x;
    }
    return res;
};

function randomInt(max, exclude) {
    var res;
    exclude = exclude || null;
    do res = Math.floor(Math.random() * max);
    while(res === exclude);
    return res;
}

function getRandomColorId() {
    return randomInt(4);
}

function greet(name) {
    return data.greetings[randomInt(data.greetings.length)].replace('%USERNAME%', name);
}

//---------------------------------------------------

function Gamer(name) {
    this.name = name;
    this.wins = ko.observable(0);
    this.status = ko.observableArray([]);
}

function Status(text, rounds) {
    this.text = text;
    this.rounds = rounds;
    this.tick = function() {this.rounds--;};
}

function gameModel(gamers) {
    var self = this;

    self.tasks = [];
    self.fails = [];
    self.gamers = gamers;
    self.step = ko.observable('start'); // start, wait, task, win, fail
    self.activeTask = ko.observable();
    self.activeFail = ko.observable();
    self.activeGamerId = ko.observable(0);
    self.activeGamer = ko.computed(function() {
        return self.gamers[self.activeGamerId()];
    }, self);

    self.sortGamers = ko.computed(function() {
        return self.gamers.sort(function(a,b) {
            if (a.wins() > b.wins()) return -1;
            if (a.wins() < b.wins()) return 1;
            return 0;
        });
    }, self);

    self.randomGamers = ko.computed(function() {
        return self.gamers.shuffle();
    }, self);


    self.colorId = ko.observable();
    self.colorClass = ko.computed(function() {
        return 'color-' + self.colorId();
    }, self);
    self.textClass = ko.computed(function() {
        return 'text-color-' + self.colorId();
    }, self);
    self.alignerClass = ko.computed(function() {
        id = this.colorId();
        if (self.step() == 'wait') id = 'back';
        if (self.step() == 'fail') id = 'fail';
        if (self.step() == 'win') id = 'win';
        return 'color-' + id;
    }, self);

    self.greetingGamer = ko.computed(function() {
        return greet(self.activeGamer().name);
    }, self);

    self.setNextGamer = function(gamer) {
        var new_id = gamer ? self.gamers.indexOf(gamer)
            : randomInt(self.gamers.length,  self.activeGamerId());
        self.activeGamerId(new_id);
    };

    self.goWait = function(gamer) {
        self.colorId(getRandomColorId());
        self.setNextGamer(gamer instanceof Gamer ? gamer : null);
        self.step('wait');
    };

    self.goTask = function() {
        self.activeTask(self.tasks.pop());
        self.step('task');
    };

    self.goWin = function() {
        self.activeGamer().wins.increment();

        self.step('win');
    };

    self.goFail = function() {
        // FIXME TO WINS
        self.activeGamer().status.push(new Status('ЛОХ', 5));
        self.activeFail(self.fails.pop());
        self.step('fail');
    };

    self.init = function(tasks, fails) {
        self.tasks = tasks.shuffle();
        self.fails = fails.shuffle();

        self.goWait();
    };
}

//--------------------------------------------------

function prepareUsers(num) {
    $('#aligner').prepend('<div id="gamers" class="color-main"><form class="form-horizontal" id="start-gamer-form"></form></div>');
    $('#btn-add-gamer').attr('data-next-id', num);
    for (var i=0; i<num; i++) {
        $('#start-gamer-form').append(startUserHtml(i));
    }
}

function startUserHtml(id) {
    return '<div class="form-group"><label class="col-xs-4 control-label">Игрок ' + (id+1) + '</label><div class="col-xs-7">' +
              '<input type="text" id="gamer' + id +'" class="form-control gamers" placeholder="Введите имя игрока"></div></div>';
}

var game;

$(document).ready(function() {
    if (navigator.userAgent.search('Windows Phone') > 0) {

    }
    prepareUsers(6);
    $('#gamer0').val('Супер Сергей');
    $('#gamer1').val('Михаил');
    $('#gamer2').val('Василий');
    $('#gamer3').val('Анатолий');
    $('#gamer4').val('Алексей Сергеевич');
    $('#btn-add-gamer').on('click', function() {
        var id = parseInt($(this).attr('data-next-id'));
        $('#start-gamer-form').append( startUserHtml(id));
        $('html, body').animate({
            scrollTop: $("#gamer"+id).offset().top
        }, 1000);
        $(this).attr('data-next-id', id+1);
    });
    $('#btn-start-game').on('click', function() {
        var gamers = [];
        $('.gamers').each(function(){
            if (this.value) {
                gamers.push(new Gamer(this.value));
            }
        });
        if (gamers.length <= 2) {
            $('#gamer'+game.gamers.length).parent()
                .after('<div id="info" class="col-xs-10 text-inf" style="display: none"><p>Нужно больше игроков!</p></div>');
            $('#info').slideDown(300).delay(1500).slideUp(500, function() {$('#info').remove();});
            return;
        }
        $('#aligner').removeClass().addClass('aligner-tasks')
            .height($('#main').height()-$('#btn-wrapper').height());
        $('#start-gamer-form').parent().remove();

        game = new gameModel(gamers);
        ko.applyBindings(game);
        game.init(data.fants, data.fails);
    });
    $('#players').on('click', function() {
        $('#scores').fadeIn();
    });
    $('#scores .close').on('click', function() {
        $('#scores').fadeOut();
    });
});
