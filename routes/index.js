var express = require('express');
var router = express.Router();

var knex = require('knex')({
   dialect: 'sqlite3',
   connection: {
      filename: 'board_data.sqlite3'
   },
   useNullAsDefault:true
});

var Bookshelf = require('bookshelf')(knex);

Bookshelf.plugin('pagination');

var User = Bookshelf.Model.extend({
   tableName: 'users'
});

/*

hasTimestamps

・タイプスタンプのデータをレコードに追加するもの
・これがtrueになっていると、レコードを保存する際にcreated_atという項目に現在の日時が、
・また、内容を更新した際にはupdated_atという項目にその日時が自動的に保存される

*/

/*

user

・userというプロパティを追加するためのもの
・belongsTo()メソッドUserモデルを引数に指定して呼び出し
・belongsTo()メソッドは「アソシエーション」と呼ばれるものの１つで、２つのテーブルレコードを関連付けるもの
・意味は「テーブルに用意された、関連テーブルのIDを示す値をつかって、別のテーブルレコードを一緒に取り出す」
・先にmessageのテーブルを作成したとき「user_id」という項目を用意した
・アソシエーションでは「テーブル名_id」という項目を用意して、その値を使って関連するレコードを取り出す
・注意したいのは、users_idではなく、user_idとかならず単数形に_idを付けること

*/

var Message = Bookshelf.Model.extend({
   tableName: 'messages',
   hasTimestamps: true,
   user: function() {
      return this.belongsTo(User);
   }
});

router.get('/', (req, res, next) => {
   if (req.session.login == null){
      res.redirect('/users');
   } else {
      res.redirect('/1');
   }
});

router.get('/:page', (req, res, next) => {
   if (req.session.login == null){
      res.redirect('/users');
      return;
   }
   var pg = req.params.page;
   pg *= 1;
   if (pg < 1){ pg = 1; }
    
   /*
   
   アソシエーションを使ったレコードの取得
   
   orderByについて
   ・orderBy('created_at', 'DESC')は、レコードを並びかえるためのメソッド
   ・第１引数にフィールド名、第２引数に「ASC」（昇順）または「DESC」（降順）
  
   アソシエーションの設定について
   ・fetchPage()メソッドで指定のページのレコードを取り出している
   ・引数で渡しているオブジェクトのwithRelated: ['user'] => これが関連付けるテーブル名を指定するもの
   ・これを指定すると、usersテーブルのレコードが一緒に取り出せるようになる
   
   取得されるレコードの保管場所について
   ・アソシエーションしたレコードのモデルは、collectionで得られるモデルの「relations」プロパティの中に、
   　テーブル名ごとに保管される仕組み
   ・今回のケースならば、relations.userに保管される
   ・<%= val.relations.user.attributes.name %> ※data_item.ejs
   
   */
    
   new Message().orderBy('created_at', 'DESC')
         .fetchPage({page:pg, pageSize:10, withRelated: ['user']})
         .then((collection) => {
      var data = {
         title: 'miniBoard',
         login:req.session.login,
         collection:collection.toArray(),
         pagination:collection.pagination
      };
      res.render('index', data);
   }).catch((err) => {
      res.status(500).json({error: true, data: {message: err.message}});
   });

});

router.post('/',(req, res, next) => {
var rec = {
   message: req.body.msg,
   user_id: req.session.login.id
 }
 new Message(rec).save().then((model) => {
   res.redirect('/');
 });
})

module.exports = router;
