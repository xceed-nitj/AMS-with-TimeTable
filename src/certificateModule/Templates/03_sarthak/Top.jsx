// import nitj_logo from '../../../assets/nitj_logo.png'
// import react_logo from '../../../assets/react.svg'

function Logo({ x, y, logoUrl }) {
  return (
    <image
      href={logoUrl}
      height="80"
      width="80"
      x={x}
      y={y}
    />
  );
}

function Top() {
  const logoUrls = ['url1.jpg', 'url2.jpg','url3.jpg','url4.jpg','url5.jpg'];

  // Calculate x and y coordinates dynamically for logos
  const calculateLogoCoordinates = (index, totalLogos) => {
    // const logoWidth = 80;  // Assuming a fixed width for the logos
    // const spacing = 20;  // Adjust spacing between logos
    // const totalWidth = totalLogos * (logoWidth + spacing) - spacing;

    // const startX = (600 - totalWidth) / 2;  // Adjust the starting point on the x-axis
    // const x = startX + index * (logoWidth + spacing);

    // const y = 90;  // Adjust the y-coordinate based on your design
    if (totalLogos <= 2) {
      if (index === 0) {
        var x = 240;
        var y = 90;
      }
      else if (index === 1) {
        var x = 800;
        var y = 90;
      }
    }
    else if(totalLogos >2 && totalLogos <=5){
      if (index%2==0) {
        var x = 280 - index*50;
        var y = 90;
      }
      else if (index%2!=0) {
        var x = 700 + index*50;
        var y = 90;
      }
    }
    return { x, y };
  };

  return (
    <>

      <path fill="url(#a)" d="M0-.21h1122.52v794.106H0Z" />
      {logoUrls.map((logoUrl, index) => {
        const { x, y } = calculateLogoCoordinates(index, logoUrls.length);
        return <Logo key={index} x={x} y={y} logoUrl={logoUrl} />;
      })}
      {/* <image href={nitj_logo} height="80" width="80" x="220" y="90"/>
      <image href={react_logo} height="80" width="80" x="820" y="90"/> */}
      <path
        fill="#272727"
        d="m81.64-.21 21.473 20.417 32.8 31.19 8.872 8.437h375.34l-7.93-8.438h558.72v641.665h-159.77l-56.79 49.246H51.604l.001-690.91h50.499l-4.534-4.721H20.416v706.209H0v41.025h529.756l22.822-20.43H897.1l13.814-12.02h95.692l-9.981 12.02h105.465v-30.886h20.416V693.06h-20.416V20.207H482.88L463.69-.211H81.64zm317.712 37.474h72.502l-2.016 2.029h-72.504l2.018-2.03zm22.103 5.873h59.207l-2.03 2.029H419.44l2.016-2.03zM27.29 516.594 44.717 536.6v46.748l-17.43-20.006.002-46.748zm0 64.527 17.428 20.01v91.135L27.289 672.26v-91.14zM7.57 764.307h85.897l-32.399 21.39H7.572l-.002-21.39zm99.65 0h44.95l-27.713 21.39H75.629l31.592-21.39z"
      />
      <path fill="#272727" d="M852.874 734.183h-97.626l3.335-3.334h97.625z" />
      <path fill="#272727" d="M838.357 724.496H718.792l3.347-3.334h119.552z" />
      <g fill="#8059D4">
        <path d="m965.03 729.092-11.842 13.474.029.028H708.68l-11.047 10.181H543.836l-73.547 41.135h652.217v-51.316h-48.955l9.742-11.086-2.746-2.416-11.84 13.474.027.028h-8.027l9.756-11.086-2.76-2.416-11.84 13.474.04.028h-8.026l9.742-11.086-2.744-2.416-11.842 13.474.04.028h-8.038l9.754-11.086-2.758-2.416-11.84 13.474.041.028h-8.027l9.742-11.086-2.744-2.416-11.842 13.474.04.028h-8.024l9.74-11.086-2.744-2.416-11.84 13.474.027.027h-8.027l9.742-11.085-2.744-2.416-11.842 13.474.04.027h-8.027l9.743-11.086-2.745-2.416-11.84 13.475.028.027h-8.027l9.755-11.086-2.757-2.416-11.842 13.475.04.027h-8.027l9.743-11.086zm-54.116 32.369h95.692l-11.28 13.584H895.301Z" />
        <path d="M420.276 752.775h-51.234l-34.673-33.59h48.86zm-95.595 0h-95.553l-29.294-33.59h87.8zm-120.251 0H0v-33.59h167.383z" />
        <path d="m370.424 59.834 18.54 23.01h69.499L433.1 59.834ZM0-.211v46.887h97.57l34.73 36.168h227.056l-16.197-23.01H144.785L81.641-.211Z" />
      </g>
      <path fill="#272727" d="M436.906 739.314H0v-6.668h430.238z" />

      {/* top line */}
      <path
        fill="#272727"
        d="M856.926 284.552H275.594a.732.732 0 0 1-.727-.727c0-.398.33-.727.727-.727h571.332c.398 0 .727.329.727.727 0 .411-.33.727-.727.727z"
      />
      <path
        fill="#1E0C45"
        d="M567.798 283.839a16.163 16.163 0 0 1-6.545 6.544 16.163 16.163 0 0 1-6.545-6.544 16.163 16.163 0 0 1 6.545-6.545 16.08 16.08 0 0 1 6.545 6.545z"
      />
      <path
        fill="#272727"
        d="M576.73 283.619a9.667 9.667 0 0 1-3.677 4.103 9.667 9.667 0 0 1-4.102-3.678 9.61 9.61 0 0 1 3.69-4.102 9.711 9.711 0 0 1 4.09 3.677z"
      />
      <path
        fill="#272727"
        d="M553.583 283.619a9.61 9.61 0 0 1-3.69 4.103 9.667 9.667 0 0 1-4.103-3.678 9.667 9.667 0 0 1 3.677-4.102 9.623 9.623 0 0 1 4.116 3.677z"
      />
      <path
        fill="#8059D4"
        d="M941.21 48.72v158.354l39.722-19.84 39.722 19.84V48.721Z"
      />
      <path
        fill="#272727"
        d="M941.21 48.72v158.354l39.722-19.84V48.721Z"
        opacity=".1"
      />
      <path
        fill="#272727"
        d="M1032.922 124.213c0 28.444-22.942 51.523-51.345 51.728-.137.014-.26.014-.398.014-28.58 0-51.742-23.161-51.742-51.742 0-28.581 23.161-51.742 51.742-51.742.138 0 .261 0 .398.014 28.403.205 51.345 23.284 51.345 51.728z"
      />
      <path
        fill="#272727"
        d="M981.577 72.485v103.47c-.137.014-.26.014-.398.014-28.58 0-51.742-23.161-51.742-51.742 0-28.581 23.161-51.742 51.742-51.742.138-.014.261-.014.398 0z"
        opacity=".4"
      />
      <path
        fill="#FFFFFF"
        d="M980.535 74.912c-.014 0-.043.015-.043.03-.103.679.186 1.504.645 2.113-.692 0-1.378.022-2.063.052-.235-.941-1.235-1.841-2.271-2.002-.013 0-.041.014-.041.041-.052.68.298 1.484.8 2.06-.684.051-1.365.117-2.04.198-.297-.924-1.372-1.757-2.424-1.832-.013 0-.041.028-.041.028 0 .686.409 1.461.953 1.996a44.76 44.76 0 0 0-2.012.36c-.375-.895-1.503-1.63-2.55-1.63-.029 0-.042.027-.042.041.053.68.523 1.423 1.11 1.914-.67.156-1.335.324-1.995.508-.44-.868-1.62-1.52-2.667-1.434-.027 0-.042.028-.028.055.102.668.604 1.362 1.207 1.809-.649.204-1.293.42-1.93.652-.503-.828-1.728-1.386-2.763-1.226-.013 0-.027.027-.041.054.155.67.727 1.332 1.377 1.729-.631.253-1.256.52-1.873.799-.559-.791-1.825-1.251-2.852-1.016-.027 0-.041.026-.027.053.204.65.814 1.266 1.484 1.615a47.07 47.07 0 0 0-1.795.926c-.623-.75-1.92-1.119-2.927-.797-.028.014-.041.04-.014.055.251.636.92 1.205 1.625 1.5-.594.35-1.177.713-1.754 1.087-.67-.7-1.996-.984-2.986-.586v.002c-.013.013-.028.027-.028.04.306.626 1.025 1.149 1.756 1.386a47.46 47.46 0 0 0-1.67 1.213c-.72-.655-2.074-.824-3.021-.361a.101.101 0 0 0-.027.054c.35.598 1.11 1.061 1.859 1.243-.53.43-1.047.877-1.557 1.33-.766-.599-2.13-.67-3.047-.131-.014.014-.027.04-.013.055.396.568 1.189.975 1.95 1.097-.5.475-.991.96-1.472 1.457-.808-.537-2.171-.51-3.045.094-.013.014-.027.04-.013.055.437.534 1.25.878 2.013.947-.462.51-.911 1.031-1.351 1.56-.85-.469-2.206-.333-3.022.333a.042.042 0 0 0 0 .054c.47.508 1.311.79 2.08.797-.421.54-.83 1.091-1.228 1.65-.887-.404-2.218-.172-2.992.56a.042.042 0 0 0 0 .054c.51.465 1.361.683 2.125.637a47.227 47.227 0 0 0-1.098 1.726c-.909-.326-2.215.012-2.92.793a.042.042 0 0 0 0 .055c.54.422 1.402.576 2.158.472a47.133 47.133 0 0 0-.96 1.809c-.939-.255-2.218.177-2.86 1.012-.013.013-.013.04.014.054.572.374 1.437.462 2.18.307a46.864 46.864 0 0 0-.829 1.883c-.955-.18-2.189.353-2.763 1.226-.014.014-.001.041.011.055.598.328 1.462.355 2.188.15a46.775 46.775 0 0 0-.666 1.917c-.962-.108-2.148.517-2.658 1.433-.014.014-.016.04.011.055.617.285 1.487.243 2.2-.022a46.738 46.738 0 0 0-.528 1.971c-.97-.038-2.11.672-2.549 1.633-.014.014 0 .04.014.055.637.234 1.5.125 2.19-.192a46.96 46.96 0 0 0-.37 2.01c-.963.043-2.048.838-2.41 1.816-.014.014 0 .043.014.057.655.192 1.515.016 2.18-.358a47.03 47.03 0 0 0-.221 2.028c-.96.108-1.988.978-2.276 1.992-.013.028 0 .042.028.055.666.139 1.499-.098 2.13-.514a47.793 47.793 0 0 0-.058 2.027c-.948.186-1.9 1.14-2.113 2.164-.013.027 0 .055.027.028.677.095 1.497-.204 2.098-.672.014.69.04 1.377.084 2.06-.932.252-1.81 1.27-1.948 2.317 0 .027.015.04.028.04.682.037 1.474-.323 2.037-.831.065.68.15 1.354.244 2.025-.911.327-1.707 1.404-1.76 2.457 0 .027.014.041.041.041.682-.015 1.44-.437 1.961-.988.118.675.247 1.345.393 2.01-.883.394-1.594 1.53-1.573 2.586 0 .014.016.042.03.027.68-.066 1.407-.537 1.886-1.121.169.662.355 1.316.551 1.967-.85.458-1.475 1.65-1.369 2.695 0 .027.03.043.03.043.68-.119 1.375-.66 1.806-1.293.22.652.452 1.297.7 1.936-.811.522-1.344 1.753-1.163 2.785 0 .028.014.04.055.027.65-.166 1.29-.734 1.676-1.377.266.626.548 1.244.84 1.856-.773.581-1.208 1.858-.952 2.87.014.014.027.026.055.026.647-.22 1.25-.851 1.584-1.535.313.605.638 1.202.977 1.791-.732.638-1.08 1.947-.737 2.941 0 .028.029.03.057.016.624-.265 1.175-.936 1.457-1.64a47.3 47.3 0 0 0 1.111 1.726c-.676.69-.918 2.013-.512 2.986 0 .014.027.028.041.014.618-.313 1.125-1.036 1.348-1.77.404.556.82 1.102 1.248 1.64-.628.735-.773 2.08-.29 3.024h.001c0 .014.026.014.04.014.593-.357 1.046-1.117 1.214-1.865.442.52.893 1.034 1.357 1.535-.573.781-.617 2.132-.06 3.033.014.027.028.029.055.016.554-.406.943-1.194 1.056-1.95.48.487.974.963 1.475 1.428-.51.823-.45 2.174.172 3.032 0 .013.028.027.056 0 .523-.443.852-1.256.907-2.016.514.448 1.038.886 1.572 1.313-.442.865-.285 2.203.4 3.007h.002c0 .027.028.027.055 0 .483-.475.745-1.303.746-2.062.545.407 1.103.8 1.666 1.183-.375.89-.105 2.216.633 2.965.014.014.043.014.043 0 .454-.52.655-1.38.592-2.142.58.369 1.17.726 1.767 1.07-.311.918.048 2.215.85 2.91a.042.042 0 0 0 .056 0c.412-.543.55-1.405.436-2.158.598.319 1.201.628 1.814.922-.23.939.229 2.2 1.07 2.83.014 0 .041-.002.055-.016.366-.578.439-1.444.27-2.183.623.273 1.254.532 1.89.779-.16.95.4 2.172 1.284 2.736.013.014.04.015.054-.013.321-.599.328-1.465.106-2.188.64.224 1.284.438 1.935.635-.082.96.563 2.136 1.487 2.623.014.014.04 0 .055-.014.276-.62.221-1.482-.053-2.185.649.173 1.305.329 1.965.474-.008.97.724 2.09 1.681 2.506.013.013.043.002.057-.025.227-.637.098-1.495-.234-2.176.669.125 1.342.24 2.021.336.059.964.872 2.022 1.861 2.373.014.014.042 0 .057-.041.181-.646-.002-1.483-.377-2.135a47.34 47.34 0 0 0 2.01.168c.133.957 1.03 1.962 2.043 2.229.014.013.04-.001.04-.03.125-.667-.132-1.5-.566-2.125.531.018 1.06.041 1.596.041.154 0 .305-.01.459-.011.202.946 1.168 1.876 2.203 2.068.013 0 .041-.013.041-.027.073-.676-.244-1.488-.723-2.08a47.76 47.76 0 0 0 2.05-.133c.273.927 1.307 1.781 2.35 1.898v-.002c.015 0 .042-.012.042-.039.022-.68-.351-1.46-.867-2.012.673-.079 1.345-.17 2.01-.277.345.904 1.438 1.68 2.492 1.711.028 0 .042-.013.029-.04-.022-.676-.458-1.428-1.02-1.94a46.672 46.672 0 0 0 2.012-.444c.412.874 1.57 1.563 2.615 1.52.013 0 .028-.014.041-.041-.08-.677-.575-1.395-1.176-1.862a46.792 46.792 0 0 0 1.953-.582c.475.841 1.678 1.446 2.723 1.319.027 0 .04-.027.04-.041-.132-.673-.67-1.352-1.3-1.774.637-.23 1.267-.478 1.89-.734.54.806 1.78 1.31 2.813 1.107.027 0 .04-.027.025-.054-.182-.658-.77-1.291-1.43-1.662.623-.28 1.239-.572 1.846-.877.6.762 1.878 1.17 2.893.892.013 0 .028-.027.014-.054-.225-.634-.856-1.219-1.537-1.542a47.188 47.188 0 0 0 1.764-1.015c.65.722 1.96 1.041 2.957.678.013-.014.028-.028.014-.055-.274-.63-.965-1.173-1.682-1.438a47.26 47.26 0 0 0 1.695-1.148c.703.671 2.037.889 3.004.459.013 0 .028-.029.014-.057-.325-.599-1.058-1.084-1.793-1.293a47.555 47.555 0 0 0 1.613-1.275c.75.612 2.09.726 3.02.223.027 0 .025-.028.025-.055-.378-.579-1.148-1.01-1.898-1.162.512-.454 1.013-.92 1.505-1.395.793.567 2.149.585 3.041.004.014-.014.028-.04.014-.054-.415-.55-1.216-.924-1.978-1.02.477-.49.943-.99 1.398-1.5.838.5 2.199.42 3.037-.225a.042.042 0 0 0 0-.054c-.452-.519-1.279-.828-2.045-.864.442-.528.869-1.067 1.288-1.615.871.432 2.212.24 3.007-.457a.042.042 0 0 0 0-.054c-.497-.483-1.344-.731-2.109-.71.397-.555.783-1.118 1.156-1.69.898.362 2.217.073 2.957-.688.027-.014.014-.042 0-.055-.522-.434-1.375-.62-2.133-.547a47.29 47.29 0 0 0 1.024-1.781c.924.289 2.218-.097 2.893-.91.013-.014 0-.042-.014-.055-.556-.4-1.427-.516-2.18-.379.309-.608.604-1.225.887-1.848.948.221 2.205-.264 2.816-1.12v-.003c.013-.027.013-.052-.014-.052-.586-.351-1.451-.408-2.186-.225.262-.63.514-1.265.748-1.908.96.144 2.17-.444 2.713-1.34 0-.013 0-.04-.014-.055-.61-.309-1.484-.297-2.207-.056.212-.647.407-1.3.592-1.96.964.072 2.134-.598 2.604-1.536.014-.015-.001-.042-.014-.055-.63-.264-1.496-.19-2.196.103.16-.654.311-1.312.444-1.976.967-.003 2.083-.765 2.478-1.737.014-.014 0-.04-.014-.04-.65-.223-1.517-.075-2.195.279.111-.672.204-1.35.287-2.032.963-.072 2.016-.907 2.347-1.912.014-.027 0-.054-.027-.04-.661-.162-1.509.044-2.158.44.06-.678.112-1.36.143-2.046.962-.146 1.95-1.06 2.195-2.086 0-.027-.014-.04-.04-.04-.671-.11-1.498.163-2.114.61 0-.213.016-.424.016-.638 0-.48-.023-.954-.037-1.43.95-.213 1.867-1.207 2.039-2.246v-.002c0-.013-.014-.04-.041-.04-.677-.058-1.484.272-2.065.762a46.867 46.867 0 0 0-.162-2.035c.917-.294 1.748-1.35 1.844-2.39v-.002c.013-.013-.015-.04-.043-.04-.675-.006-1.452.386-1.994.918a46.986 46.986 0 0 0-.328-2.017c.901-.36 1.653-1.477 1.664-2.524 0-.027-.014-.04-.041-.04-.675.036-1.42.483-1.92 1.054-.145-.667-.3-1.33-.473-1.986.862-.432 1.523-1.597 1.46-2.637 0-.028-.014-.04-.042-.04-.675.087-1.384.594-1.84 1.204a46.713 46.713 0 0 0-.628-1.937c.842-.487 1.425-1.701 1.275-2.752 0-.027-.028-.042-.041-.028-.673.148-1.345.713-1.75 1.36a46.945 46.945 0 0 0-.78-1.91c.797-.555 1.287-1.812 1.061-2.838 0-.028-.028-.043-.055-.016-.654.191-1.277.798-1.635 1.467a47.214 47.214 0 0 0-.92-1.83c.751-.61 1.14-1.908.84-2.914 0-.028-.028-.03-.055-.03-.637.245-1.216.911-1.52 1.616a47.254 47.254 0 0 0-1.058-1.766c.71-.663 1.004-1.987.63-2.976 0-.014-.028-.028-.056-.014-.62.288-1.148.985-1.398 1.705a47.453 47.453 0 0 0-1.188-1.668c.66-.712.857-2.058.405-3.016-.015-.014-.028-.027-.055-.027-.608.345-1.086 1.102-1.274 1.852-.427-.54-.863-1.07-1.312-1.59.614-.755.715-2.117.185-3.047-.015-.014-.042-.013-.055-.027-.578.39-.997 1.183-1.129 1.945a47.566 47.566 0 0 0-1.427-1.486c.55-.805.541-2.167-.053-3.053a.042.042 0 0 0-.053 0c-.543.43-.9 1.253-.973 2.025a47.625 47.625 0 0 0-1.555-1.39c.486-.846.374-2.204-.285-3.036 0-.014-.027-.014-.041 0-.517.465-.813 1.307-.828 2.079a47.66 47.66 0 0 0-1.637-1.258c.422-.884.209-2.227-.513-3.002a.042.042 0 0 0-.055 0c-.474.503-.707 1.353-.672 2.117a47.33 47.33 0 0 0-1.715-1.117c.349-.91.032-2.229-.742-2.95-.027-.013-.041-.013-.055 0-.432.544-.596 1.414-.5 2.174-.597-.346-1.2-.68-1.813-1 .271-.926-.143-2.21-.967-2.875-.014-.013-.04-.013-.055.014-.381.557-.484 1.42-.341 2.164a46.995 46.995 0 0 0-1.868-.846c.2-.947-.314-2.197-1.18-2.785v-.002c-.013-.014-.04 0-.054.014-.348.591-.384 1.468-.18 2.203a48.53 48.53 0 0 0-1.914-.701c.126-.963-.482-2.17-1.393-2.695-.014-.014-.04 0-.055.013-.294.618-.261 1.49 0 2.205-.652-.2-1.308-.39-1.972-.562.044-.96-.646-2.106-1.592-2.563-.027-.013-.04 0-.053.014-.25.641-.155 1.51.156 2.203a46.78 46.78 0 0 0-1.998-.4c-.012-.97-.794-2.073-1.781-2.46-.027 0-.055.012-.055.012-.207.659-.044 1.526.322 2.198a46.975 46.975 0 0 0-2.025-.254c-.098-.96-.958-1.99-1.961-2.299-.027-.014-.055 0-.041.027-.147.671.08 1.515.492 2.155a47.497 47.497 0 0 0-1.762-.086c-.151-.957-1.087-1.943-2.119-2.18zm.631 4.09h.025c-.601.6-.947 1.414-.7 2.1a.03.03 0 0 0 .03.027c.897.11 1.817-.993 2.074-2.092.572.018 1.14.047 1.707.086-.628.554-1.02 1.33-.832 2.033a.03.03 0 0 0 .027.028c.89.176 1.89-.879 2.217-1.954.675.068 1.344.155 2.01.252-.678.507-1.137 1.254-.989 1.961a.03.03 0 0 0 .027.03c.872.24 1.94-.715 2.354-1.756.66.118 1.316.248 1.967.394-.707.454-1.213 1.161-1.123 1.881a.03.03 0 0 0 .027.03c.853.306 1.993-.579 2.486-1.588.649.167 1.29.353 1.928.548-.748.398-1.313 1.069-1.272 1.793a.03.03 0 0 0 .027.028c.816.37 2.016-.41 2.586-1.377.633.216 1.259.446 1.879.69-.762.341-1.368.964-1.393 1.689 0 .014.014.027.014.04.802.439 2.067-.266 2.7-1.197.618.266 1.231.54 1.836.832-.797.283-1.456.862-1.53 1.586 0 .014 0 .027.014.041.755.492 2.065-.11 2.772-.984.593.31 1.177.634 1.754.969-.809.224-1.5.746-1.631 1.457 0 .013 0 .028.016.04.72.548 2.066.053 2.838-.765a47.29 47.29 0 0 1 1.67 1.088c-.821.162-1.55.63-1.739 1.324 0 .014 0 .027.014.041.676.6 2.053.208 2.883-.54.537.393 1.064.8 1.582 1.216-.825.1-1.58.51-1.816 1.192 0 .013 0 .026.014.039.619.64 2.02.365 2.908-.313.504.431.998.872 1.483 1.324-.828.042-1.61.392-1.893 1.047v.041c.577.697 1.992.513 2.926-.103.47.468.929.95 1.379 1.44-.832-.025-1.64.268-1.973.902v.039c.52.727 1.944.665 2.92.128a45.54 45.54 0 0 1 1.271 1.536c-.827-.086-1.656.145-2.037.752v.04c.469.775 1.9.813 2.918.346.398.537.786 1.08 1.16 1.635-.823-.155-1.676.011-2.101.6-.014.014-.014.027 0 .04.401.804 1.82.954 2.873.563.352.56.692 1.126 1.02 1.701-.807-.215-1.665-.114-2.137.44-.014.013-.014.028-.014.04.339.832 1.76 1.085 2.84.77.313.593.616 1.193.904 1.801-.792-.28-1.664-.246-2.18.27-.014.014-.014.027-.014.04.285.866 1.683 1.222 2.781.987a44.9 44.9 0 0 1 .758 1.861c-.77-.343-1.644-.379-2.195.09-.013.013-.014.026-.014.04.218.875 1.576 1.338 2.69 1.189.22.633.426 1.273.619 1.92-.743-.4-1.615-.503-2.198-.077-.014.014-.014.027-.014.041.143.9 1.472 1.464 2.598 1.393.17.647.323 1.3.465 1.957-.71-.454-1.568-.62-2.184-.234-.014 0-.014.027-.014.04.076.895 1.346 1.561 2.47 1.589.121.656.228 1.316.32 1.982-.675-.508-1.518-.737-2.159-.4-.014.013-.027.028-.027.04.01.913 1.242 1.671 2.367 1.774.07.66.118 1.325.159 1.992-.635-.56-1.46-.856-2.127-.568a.03.03 0 0 0-.027.027c-.055.896 1.107 1.746 2.215 1.942.014.459.035.916.035 1.378 0 .218-.014.432-.018.649-.59-.602-1.393-.955-2.082-.717a.03.03 0 0 0-.027.027c-.133.902.976 1.844 2.072 2.11-.03.669-.077 1.333-.137 1.994-.54-.646-1.311-1.06-2.018-.879a.03.03 0 0 0-.027.027c-.196.886.826 1.898 1.895 2.25a45.199 45.199 0 0 1-.285 1.99c-.491-.68-1.228-1.148-1.94-1.017a.03.03 0 0 0-.027.03c-.263.863.679 1.951 1.717 2.39-.131.66-.281 1.312-.441 1.96-.438-.716-1.137-1.235-1.866-1.153a.03.03 0 0 0-.027.027c-.327.84.526 1.997 1.524 2.51-.18.643-.372 1.282-.58 1.914-.382-.75-1.038-1.327-1.768-1.31-.013 0-.026.015-.039.029-.385.824.385 2.05 1.348 2.63a47.59 47.59 0 0 1-.73 1.862c-.325-.78-.939-1.407-1.663-1.448-.013 0-.026.015-.039.028-.448.787.221 2.06 1.13 2.717a45.106 45.106 0 0 1-.864 1.796c-.268-.788-.827-1.445-1.543-1.535-.014 0-.027 0-.041.014-.502.742.069 2.063.922 2.791a45.07 45.07 0 0 1-1.002 1.74c-.203-.819-.715-1.53-1.43-1.678-.014 0-.027.001-.04.014-.558.71-.092 2.062.708 2.852a45.451 45.451 0 0 1-1.123 1.642c-.148-.816-.599-1.547-1.287-1.75-.014 0-.027.001-.041.014-.608.663-.246 2.041.48 2.889a43.48 43.48 0 0 1-1.246 1.562c-.084-.828-.481-1.591-1.156-1.844-.014 0-.027 0-.04.014-.664.609-.406 2.012.259 2.912-.441.495-.893.978-1.356 1.453-.025-.826-.361-1.61-1.015-1.91h-.041c-.706.554-.563 1.977.035 2.924-.478.462-.965.915-1.463 1.356.043-.834-.231-1.65-.865-2-.014-.014-.027 0-.041 0-.743.501-.702 1.942-.174 2.935-.515.427-1.041.84-1.574 1.244.107-.828-.105-1.667-.707-2.066-.014 0-.028-.014-.041 0-.784.445-.85 1.874-.405 2.902a44.17 44.17 0 0 1-1.65 1.117c.166-.814.015-1.66-.553-2.1-.014-.013-.028-.013-.04 0-.82.393-.996 1.81-.624 2.868-.572.344-1.15.68-1.738 1 .24-.808.158-1.681-.385-2.166-.013-.014-.026-.014-.039 0-.84.327-1.125 1.733-.838 2.814-.594.3-1.196.583-1.805.856.298-.788.282-1.663-.226-2.188-.014-.014-.027-.013-.041-.013-.867.263-1.257 1.66-1.04 2.767-.618.254-1.242.498-1.874.725.358-.762.41-1.637-.05-2.203-.013-.014-.028-.014-.042-.014-.886.197-1.376 1.552-1.25 2.672a44.82 44.82 0 0 1-1.93.576c.415-.734.532-1.6.121-2.191-.014-.014-.027-.014-.04-.014-.896.131-1.484 1.438-1.444 2.557-.653.157-1.31.304-1.973.433.474-.704.66-1.566.287-2.193 0-.014-.027-.029-.04-.016-.901.055-1.595 1.33-1.637 2.457-.659.107-1.323.196-1.99.274.523-.664.772-1.507.443-2.166a.03.03 0 0 0-.027-.03c-.914-.01-1.701 1.214-1.819 2.336a45.4 45.4 0 0 1-2.01.13c.575-.623.884-1.445.604-2.122a.03.03 0 0 0-.027-.027c-.9-.077-1.777 1.074-1.986 2.183-.148.001-.293.012-.442.012-.53 0-1.055-.02-1.582-.039.613-.577.98-1.37.758-2.06a.03.03 0 0 0-.027-.028c-.896-.142-1.85.936-2.144 2.018a45.35 45.35 0 0 1-2.004-.174c.657-.529 1.09-1.293.926-2.008a.03.03 0 0 0-.03-.027c-.878-.208-1.919.795-2.299 1.857a44.936 44.936 0 0 1-1.986-.332c.698-.477 1.19-1.208 1.074-1.924a.03.03 0 0 0-.027-.027c-.864-.274-1.97.642-2.422 1.67a44.819 44.819 0 0 1-1.965-.479c.732-.422 1.275-1.11 1.217-1.836a.03.03 0 0 0-.025-.027c-.83-.339-2.005.49-2.545 1.479a44.79 44.79 0 0 1-1.918-.633c.764-.367 1.361-1.017 1.361-1.752a.03.03 0 0 0-.027-.027c-.811-.406-2.048.338-2.65 1.289a44.926 44.926 0 0 1-1.854-.766c.777-.31 1.408-.908 1.457-1.635 0-.013 0-.028-.014-.04-.778-.472-2.071.182-2.746 1.085a45.174 45.174 0 0 1-1.787-.91c.806-.247 1.491-.797 1.598-1.52 0-.013 0-.028-.014-.042-.735-.526-2.072.023-2.814.87a45.277 45.277 0 0 1-1.71-1.035c.812-.193 1.52-.686 1.682-1.384 0-.014.001-.028-.011-.041-.7-.58-2.067-.136-2.87.648a45.47 45.47 0 0 1-1.628-1.16c.83-.125 1.581-.564 1.794-1.26 0-.014 0-.028-.013-.04-.653-.622-2.04-.295-2.905.42a45.616 45.616 0 0 1-1.523-1.274c.83-.067 1.602-.447 1.861-1.121v-.041c-.6-.676-2.012-.446-2.93.205a45.602 45.602 0 0 1-1.435-1.389c.833-.002 1.632-.32 1.95-.97v-.044c-.546-.719-1.975-.599-2.934-.02a45.57 45.57 0 0 1-1.324-1.495c.83.057 1.65-.201 2.007-.817v-.04c-.488-.749-1.911-.743-2.91-.243a45.502 45.502 0 0 1-1.21-1.59c.826.126 1.668-.07 2.075-.666 0-.014.014-.027 0-.04-.436-.798-1.863-.89-2.902-.456a45.438 45.438 0 0 1-1.094-1.695c.815.186 1.674.051 2.131-.512.014-.014.014-.027 0-.04-.37-.819-1.79-1.028-2.855-.679a45.191 45.191 0 0 1-.953-1.748c.8.254 1.67.188 2.162-.345.014-.013.013-.026.013-.04-.307-.855-1.72-1.167-2.818-.89-.29-.609-.57-1.222-.834-1.846.785.32 1.665.328 2.211-.16a.051.051 0 0 0 .016-.04c-.242-.867-1.627-1.284-2.743-1.099a44.844 44.844 0 0 1-.68-1.89c.758.375 1.633.45 2.2-.002.014-.014.014-.03.014-.043-.176-.887-1.53-1.405-2.649-1.3-.195-.648-.378-1.3-.545-1.96.729.44 1.6.58 2.205.174.014-.013.014-.028.014-.041-.11-.9-1.414-1.524-2.537-1.506a44.873 44.873 0 0 1-.385-1.97c.691.486 1.547.688 2.182.333.014 0 .027-.027.027-.04-.043-.914-1.302-1.63-2.43-1.692a45.053 45.053 0 0 1-.24-2.004c.655.543 1.5.812 2.162.498.015-.014.028-.014.028-.04.022-.914-1.177-1.725-2.297-1.87a45.63 45.63 0 0 1-.08-2c.609.583 1.42.913 2.103.658a.03.03 0 0 0 .027-.027c.1-.9-1.037-1.805-2.142-2.04.007-.673.024-1.343.06-2.009.565.63 1.355 1.016 2.055.81a.03.03 0 0 0 .028-.027c.164-.886-.893-1.864-1.975-2.181a45.19 45.19 0 0 1 .22-2.014c.515.67 1.27 1.119 1.987.97a.03.03 0 0 0 .027-.027c.231-.88-.756-1.943-1.814-2.334.109-.668.229-1.332.367-1.99.463.707 1.185 1.206 1.9 1.1a.03.03 0 0 0 .028-.028c.294-.85-.592-1.975-1.608-2.455.16-.652.333-1.298.52-1.94.408.744 1.089 1.302 1.814 1.253a.03.03 0 0 0 .03-.027c.36-.831-.45-2.023-1.43-2.577.208-.639.428-1.272.664-1.898.35.766.98 1.37 1.71 1.387.014 0 .029-.012.042-.012.429-.802-.298-2.057-1.236-2.68.257-.623.528-1.238.812-1.847.293.79.882 1.442 1.606 1.507.014 0 .027-.013.04-.013.483-.766-.141-2.073-1.025-2.77.3-.593.61-1.18.934-1.758.235.802.767 1.483 1.476 1.606.014 0 .028 0 .041-.014.537-.722.022-2.07-.804-2.828.347-.576.71-1.142 1.082-1.701.173.82.652 1.543 1.355 1.715.013 0 .028 0 .041-.014.588-.685.178-2.05-.582-2.871.385-.54.78-1.072 1.188-1.594.114.824.539 1.576 1.22 1.803.014 0 .027.001.041-.012.644-.633.335-2.037-.367-2.914.424-.51.855-1.012 1.3-1.502.048.836.409 1.621 1.07 1.89h.04c.682-.583.489-1.988-.133-2.915.464-.48.938-.946 1.422-1.405-.01.832.294 1.635.934 1.96h.04c.732-.535.642-1.961.081-2.934.494-.44.997-.87 1.51-1.287-.072.823.17 1.64.785 2.011.013.014.028.014.04 0 .762-.467.783-1.89.306-2.902a46.57 46.57 0 0 1 1.611-1.17c-.137.819.04 1.657.623 2.07.013.014.026.014.04 0 .79-.412.923-1.825.528-2.87a45.276 45.276 0 0 1 1.702-1.053c-.204.808-.094 1.661.46 2.125.014.014.029.014.042 0 .83-.35 1.067-1.77.74-2.842.586-.32 1.181-.625 1.783-.92-.27.798-.223 1.671.303 2.172.014.013.027.012.04.012.852-.295 1.199-1.686.95-2.784a44.939 44.939 0 0 1 1.83-.777c-.324.771-.344 1.638.129 2.176.014.014.027.013.04.013.876-.229 1.322-1.595 1.16-2.705.63-.228 1.264-.447 1.907-.648-.393.75-.484 1.629-.047 2.215.013.014.028.013.041.013.887-.164 1.439-1.492 1.36-2.617.644-.18 1.294-.344 1.949-.496-.44.715-.587 1.574-.193 2.18.013.014.026.014.039.014.898-.088 1.549-1.375 1.55-2.5a44.867 44.867 0 0 1 1.97-.348c-.502.682-.721 1.533-.376 2.176.014.014.027.027.041.027.909-.022 1.647-1.255 1.733-2.38.657-.08 1.32-.144 1.986-.194-.54.639-.815 1.46-.521 2.12a.03.03 0 0 0 .025.03c.908.043 1.743-1.131 1.918-2.242.666-.03 1.334-.05 2.008-.05z"
      />
    </>
  )
}

export default Top
