(function($) {
  Drupal.behaviors.read_more = {
    trimTextWithHtml: function (element, count) {
      const text = $(element).text();
      let trimmedText = text.substring(0, count);
      const lastSpaceIndex = trimmedText.lastIndexOf(' ');
      if (lastSpaceIndex !== -1) {
        trimmedText = trimmedText.substring(0, lastSpaceIndex);
      } else {
        trimmedText = trimmedText.substring(0, trimmedText.length - 1);
      }
      if (trimmedText.length < text.length) {
        // target all read more elements
        const words = trimmedText.split(' ');
        const options = {
          isInline: true,
          wordsCount: words.length,
          moreText: 'see more',
          lessText: '',
        }
        // Init
        window.readSmore([element], options).init();
      }
    },
    attach: function(context) {
      const self = this;
      $(once('read-more', '.content-detail__description--video', context)).each((descriptionIndex, descriptionElement) => {
        self.trimTextWithHtml(descriptionElement, 240);
      });
    }
  };
})(jQuery);
