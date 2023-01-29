class Carousel {
  constructor(element, data) {
    this.board = element;
    this.data = data;
    this.index = 0;
    this.handle(); // handle getures
  }

  handle() {
    this.cards = this.board.querySelectorAll('.card'); // list all cards

    this.topCard = this.cards[this.cards.length - 1]; // get top card
    this.nextCard = this.cards[this.cards.length - 2]; // get next card

    if (this.cards.length > 0) {
      // set default top card position and scale
      this.topCard.style.transform =
        'translateX(-50%) translateY(-50%) rotate(0deg) rotateY(0deg) scale(1)';

      // destroy previous Hammer instance, if present
      if (this.hammer) this.hammer.destroy();

      // listen for pan gesture on top card
      this.hammer = new Hammer(this.topCard);
      this.hammer.add(
        new Hammer.Pan({
          position: Hammer.position_ALL,
          threshold: 0
        })
      );

      // pass event data to custom callbacks
      this.hammer.on('tap', e => this.onTap(e));
      this.hammer.on("pan", e => this.onPan(e));
    }
  }

  onTap() {
    // get finger position on top card
    let propX = (e.center.x - e.target.getBoundingClientRect().left) / e.target.clientWidth;

    // get degree of Y rotation (+/-15 degrees)
    let rotateY = 15 * (propX < 0.05 ? -1 : 1);

    // change the transition property
    this.topCard.style.transition = 'transform 100ms ease-out';

    // rotate
    this.topCard.style.transform =
      `translateX(-50%) translateY(-50%) rotate(0deg) rotateY(${rotateY}deg) scale(1)`;

    // wait transition end
    setTimeout(() => {
      // reset transform properties
      this.topCard.style.transform =
        'translateX(-50%) translateY(-50%) rotate(0deg) rotateY(0deg) scale(1)';
    }, 100);
  }

  onPan(e) {
    if (!this.isPanning) {
      this.isPanning = true;

      // remove transition property
      this.topCard.style.transition = null;

      // get starting coordinates
      let style = window.getComputedStyle(this.topCard);
      let mx = style.transform.match(/^matrix\((.+)\)$/);
      this.startPosX = mx ? parseFloat(mx[1].split(', ')[4]) : 0;
      this.startPosY = mx ? parseFloat(mx[1].split(', ')[5]) : 0;

      // get card bounds
      let bounds = this.topCard.getBoundingClientRect();

      // get finger position, top (1) or bottom (-1) of the card
      this.isDraggingFrom = (e.center.y - bounds.top) > this.topCard.clientHeight / 2 ? -1 : 1;
    }

    // calculate new coordinates
    let posX = e.deltaX + this.startPosX;
    let posY = e.deltaY + this.startPosX;

    // get ratio between swiped pixels and the axes
    let propX = e.deltaX / this.board.clientWidth;
    let propY = e.deltaY / this.board.clientHeight;

    if (propX > 0)
    {
      this.topCard.style.boxShadow = "0px 0px 10px rgba(0, " + 255 * Math.sqrt(propX) + ", 0, .5)";
    }
    else
    {
      this.topCard.style.boxShadow = "0px 0px 10px rgba(" + 255 * Math.sqrt(-propX) + ", 0, 0, .3)";
    }

    // get swipe direction, left (-1) or right (1)
    let dirX = e.deltaX < 0 ? -1 : 1;

    // get degrees of rotation between 0 and +/- 45
    let deg = this.isDraggingFrom * dirX * Math.abs(propX) * 45;

    // calculate scale ratio, between 95 and 100 %
    let scale = (95 + 5 * Math.abs(propX)) / 100;

    // move top card
    this.topCard.style.transform = `translateX(${posX}px) translateY(${posY}px) rotate(${deg}deg) rotateY(0deg) scale(1)`;

    // scale next card
    if (this.nextCard) {
      this.nextCard.style.transform = `translateX(-50%) translateY(-50%) rotate(0deg) scale(${scale})`;
    }

    if (e.isFinal) {
      this.isPanning = false;
      let successful = false;

      // set back transition property
      this.topCard.style.transition = 'transform 200ms ease-out';
      if (this.nextCard)
        this.nextCard.style.transition = 'transform 100ms linear';

      // check threshold
      if (propX > 0.25 && e.direction == Hammer.DIRECTION_RIGHT) {
        successful = true;
        // get right border position
        posX = this.board.clientWidth;
      } else if (propX < -0.25 && e.direction == Hammer.DIRECTION_LEFT) {
        successful = true;
        posX = - (this.board.clientWidth + this.topCard.clientWidth);
      } else if (propY < -0.25 && e.direction == Hammer.DIRECTION_UP) {
        successful = true;
        // get top border position
        posY = - (this.board.clientHeight + this.topCard.clientHeight);
      }

      if (successful) {
        // throw card in the chosen direction
        this.topCard.style.transform = `translateX(${posX}px) translateY(${posY}px) rotate(${deg}deg)`;

        // wait transition end
        setTimeout(() => {
          this.board.removeChild(this.topCard);
          if (!this.topCard.classList.contains("card-intro"))
          {
            let skip = posX < 0 && !this.topCard.classList.contains("card-intro");
            if (skip)
            {
              this.data[this.topCard.card_index].skip = true;
              console.log("removed", this.data, this.topCard.card_index, this.topCard.classList.contains("card-back"));

              // cards = this.board.querySelectorAll('.card');
              //
              // cards.forEach((item, i) => {
              //   if (this.data[item.card_index].skip)
              //   {
              //     if (item != this.topCard || item != this.nextCard)
              //     {
              //       console.log("here2");
              //         item.remove();
              //     }
              //   }
              // });
              //
              // console.log("here");

            }
            if (!skip)
            {
              this.data[this.topCard.card_index].skip = false;
            }
          }

          if (!this.topCard.classList.contains("card-back"))
          {
            this.push();
          }

          this.handle();
          console.log("here", this.topCard);

        }, 200);
      } else {
        // reset card position
        this.topCard.style.transform = 'translateX(-50%) translateY(-50%)';
        this.topCard.style.boxShadow = "0px 0px 10px rgba(0, 0, 0, .1)";
        if (this.nextCard)
          this.nextCard.style.transform =
            'translateX(-50%) translateY(-50%) rotate(0deg) rotateY(0deg) scale(0.95)';
      }
    }
  }

  push() {

    if (this.data.length > 0)
    {

      let i = 0;
      while (this.data[this.index].skip && i < this.data.length) { this.index = (this.index + 1) % this.data.length; i++; }

      if (i < this.data.length)
      {
        let card = document.createElement('div')
        let card_back = document.createElement('div')
        let title = document.createElement('p')
        let bio = document.createElement('p')

        card.classList.add('card');
        card_back.classList.add('card');
        card_back.classList.add('card-back');

        card.card_index = this.index;
        card_back.card_index = this.index;

        title.innerHTML = this.data[this.index].name;
        title.classList.add('card-title');

        bio.classList.add('card-bio');
        bio.innerHTML = this.data[this.index].bio;

        let title2 = document.createElement('p')
        title2.innerHTML = this.data[this.index].name;
        title2.classList.add('card-back-title');
        card_back.style.flexDirection = "column"

        card.appendChild(title);
        card_back.appendChild(title2);
        card_back.appendChild(bio);

        //card.style.backgroundImage = "url('https://picsum.photos/320/320/?random=" + Math.round(Math.random() * 1000000) + "')";
        card.style.backgroundImage = "url('" + this.data[this.index].img + "')";

        this.index = (this.index + 1) % this.data.length;

        this.board.insertBefore(card, this.board.firstChild);
        this.board.insertBefore(card_back, this.board.firstChild);
      }
    }
  }

}

var board = document.querySelector('#board');
var data = [
  // { name: "Joe Biden",
  //   img: "https://upload.wikimedia.org/wikipedia/commons/6/68/Joe_Biden_presidential_portrait.jpg",
  //   bio: "test 1",
  //   skip: false
  // },
  // {
  //   name: "Alexandria Ocasio-Cortez",
  //   img: "http://t3.gstatic.com/licensed-image?q=tbn:ANd9GcRxMhoxpm4tNcJlUravMWPGR7H725Zn8C9LLGr4696yn3E99WmB6hLnqfHd-YlAeZr_",
  //   bio: "test 2",
  //   skip: false
  // },
  {
    name: "Patty Acomb",
    img: "https://www.house.mn.gov/hinfo/memberimgls93/45B.gif?v=112221",
    bio: "Patty Acomb is a Democratic politician and environmental activist from Minnesota. A natural resource manager, Acomb has been active in environmental advocacy as a member of several national and state government commissions on the environment. She is currently a member of the Minnesota House of Representatives.",
    skip: false
  },
  {
    name: "Marion O'Neill",
    img: "https://www.house.mn.gov/hinfo/memberimgls93/29B.gif?v=112221",
    bio: "Marion O'Neill is a Minnesota politician and member of the Minnesota House of Representatives. A member of the Republican Party of Minnesota, she represents District 29B in central Minnesota.",
    skip: false
  },
  {
    name: "Paul Anderson",
    img: "https://www.house.mn.gov/hinfo/memberimgls93/12A.gif?v=112221",
    bio: "Paul H. Anderson is a Minnesota politician and member of the Minnesota House of Representatives. A member of the Republican Party of Minnesota, he represents District 12B, which includes portions of Douglas, Pope and Stearns counties in the west central part of the state. He is also a farmer.",
    skip: false
  },
  {
    name: "Kristin Bahner",
    img: "https://www.house.mn.gov/hinfo/memberimgls93/37B.gif?v=112221",
    bio: "Kristin Bahner is an American politician and member of the Minnesota House of Representatives. A member of the Minnesota Democratic–Farmer–Labor Party, she represents District 34B in the northwestern Twin Cities metropolitan area of Maple Grove and Osseo.",
    skip: false
  },
  {
    name: "Dave Baker",
    img: "https://www.house.mn.gov/hinfo/memberimgls93/16B.gif?v=112221",
    bio: "Dave Baker is a Minnesota politician and member of the Minnesota House of Representatives. A member of the Republican Party of Minnesota, he represents District 17B in west-central Minnesota. He won his seat in 2015 after defeating his opponent Mary Sawatzky whom he proceeded the office from.",
    skip: false
  },
  {
    name: "Peggy Bennett",
    img: "https://www.house.mn.gov/hinfo/memberimgls93/23A.gif?v=112221",
    bio: "Peggy Bennett is an American politician serving as a member of the Minnesota House of Representatives since 2015. A member of the Republican Party of Minnesota, she represents District 27A in Southern Minnesota, which includes 95% of Freeborn County, four townships in Faribault County, one township in Mower County, two townships in Dodge County, and the city of Blooming Prairie in Steele County.",
    skip: false
  },
  {
    name: "Robert Bierman",
    img: "https://www.house.mn.gov/hinfo/memberimgls93/56A.gif?v=112221",
    bio: "Robert Bierman is an American politician and member of the Minnesota House of Representatives. A member of the Minnesota Democratic–Farmer–Labor Party, he represents District 57A in the southern Twin Cities. metropolitan area",
    skip: false
  },
  {
    name: "Jeff Brand",
    img: "https://www.house.mn.gov/hinfo/memberimgls93/18A.gif?v=112221",
    bio: "Jeff Brand is an American politician and member of the Minnesota House of Representatives. A member of the Minnesota Democratic–Farmer–Labor Party, he represented District 19A in south-central Minnesota from 2019 to the start of the 2021 Legislative session.",
    skip: false
  },
  {
    name: "Leigh Finke",
    img: "https://www.house.mn.gov/hinfo/memberimgls93/66A.gif?v=112221",
    bio: "Leigh Finke is an American politician who is a member of the Minnesota House of Representatives for the 66A district, which includes the cities of Falcon Heights, Lauderdale, southeastern Roseville, and portions of Saint Paul",
    skip: false
  },
  {
    name: "Mary Frances Clardy",
    img: "https://www.house.mn.gov/hinfo/memberimgls93/53A.gif?v=112221",
    bio: "Mary Frances Clardy is an American educator and politician serving as a member of the Minnesota House of Representatives for the 53A district. Elected in November 2022, she assumed office on January 3, 2023.",
    skip: false
  },
  {
    name: "Brion Curran",
    img: "https://www.house.mn.gov/hinfo/memberimgls93/36B.gif?v=112221",
    bio: "Brion Curran is an American politician serving as a member of the Minnesota House of Representatives for the 36B district. Elected in November 2022, she assumed office on January 3, 2023."
  },
  {
    name: "Jay Xiong",
    img: "https://www.house.mn.gov/hinfo/memberimgls93/67B.gif?v=112221",
    bio: "Jay Xiong is an American politician and member of the Minnesota House of Representatives. A member of the Minnesota Democratic–Farmer–Labor Party, he represents District 67B in Saint Paul. Xiong was appointed Vice Chair of the Military & Veteran Affairs Division."
  }
];
var carousel = new Carousel(board, data);
