var next = 6;
(function() {
    Handlebars.templates = Handlebars.templates || {};

    var templates = document.querySelectorAll('template');

    Array.prototype.slice.call(templates).forEach(function(tmpl) {
        Handlebars.templates[tmpl.id] = Handlebars.compile(tmpl.innerHTML.replace(/{{&gt;/g, '{{>'));
    });

    Handlebars.partials = Handlebars.templates;


    var HomeModel = Backbone.Model.extend({ //where i get the data
        initialize: function() {
            this.fetch(); //makes get request to url (/home)
        },
        url: '/home'
    });


    var HomeView = Backbone.View.extend({
        initialize: function() {
            var view = this;
            this.model.on('change', function() {
                view.render();
            });
        },
        render: function () {
            var data = this.model.toJSON();
            var images = data.images;
            var dataSliced = images.slice(0, 6);
            this.$el.html(Handlebars.templates.images({images:dataSliced}))
        },
        events: {
            'click .more': function () {
               next += 6;
               var images = this.model.get('images');
               var sliced = images.slice(0, next);
               this.$el.html(Handlebars.templates.images({images: sliced}))
            }
        }
    });


    var UploadModel = Backbone.Model.extend({
        save: function(){
            var formData = new FormData();
            formData.append('file', this.get('file'))
            formData.append('username', this.get('username'))
            formData.append('title', this.get('title'))
            formData.append('description', this.get('description'))
            $.ajax({
                url: '/upload',
                method: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function() {
                    console.log('inside success');
                    window.location = '/#/'
                }
            });
        }
    })


    var UploadView = Backbone.View.extend({
        initialize: function() {
            console.log('Upload view initializing');
            var view = this;
                view.render();
        },
        render: function() {
            var html = Handlebars.templates.uploads();
            this.$el.html(html)
        },
        events: {
            'click .upload-button': function() {
                this.model.set({
                    username: $('input[name="username"]').val(),
                    title: $('input[name="title"]').val(),
                    description: $('input[name="description"]').val(),
                    file: $('input[type="file"]').get(0).files[0]
                })
                this.model.save()
            },
        }
    })

    var ImageModel = Backbone.Model.extend({
        initialize: function(){
            console.log('anything');
            this.fetch()
        },
        url: function() {
            return '/image/' + this.get('id')
        }
    })

    var ImageView = Backbone.View.extend({
        initialize: function(options) {
            this.otherModel= options.otherModel
            var view = this;
            this.model.on('change', function() {
                view.render()
            })
        },
        render: function(){
            var html = Handlebars.templates.image(this.model.toJSON());
            this.$el.html(html);
        },
        events: {
            'click .cmnt_btn': function(e) {
                this.otherModel.set({
                    username: $('input[name="username"]').val(),
                    comment: $('input[name="comment"]').val()
                }),
                this.otherModel.save().then((data) =>{
                    if(data.success){
                        this.model.trigger('success')
                    }
                })
            }
        }
    })


    var CommentModel = Backbone.Model.extend({
        url: '/postComment'
    })

    var main = $('#main')

    var Router = Backbone.Router.extend({
        routes: {
            '': 'home',
            'upload-image': 'upload',
            'image/:id': 'image'
        },
        home: function() {
            main.off();
            new HomeView({
                model: new HomeModel,
                el: '#main'
            })
        },

        upload: function() {
            main.off()
            var uploadView = new UploadView({
                model: new UploadModel,
                el: '#main'
            })

        },

        image: function(id) {
            var commentModel = new CommentModel({imageId:id})
            var imageModel = new ImageModel({id:id})
            main.off();
            new ImageView({
                model: imageModel.on('success', () =>{
                    imageModel.fetch()
                }),
                otherModel: commentModel,
                el: '#main'
            })
        }
    });

    var router = new Router;

    Backbone.history.start();

})();
