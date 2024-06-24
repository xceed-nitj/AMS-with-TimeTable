import { Flex } from '@chakra-ui/react'
import { useRive, Layout, Fit, Alignment } from '@rive-app/react-canvas'

export const LogoAnimation = (props) => {
  const { RiveComponent } = useRive({
    src: '/xceed_logo_animation.riv',
    position: 'absolute',
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
    autoplay: true,
    loop: true,
  })

  return (
    <Flex
      position={'relative'}
      alignItems={'center'}
      justifyContent={'center'}
      minH={{
        base: '50vh',
        md: '100vh',
      }}
      width={'100%'}
      flexBasis={{
        base: '50%',
        lg: '70%',
      }}
      bg={'blackAlpha.900'}
      sx={{
        '&>*': {
          position: 'absolute',
        },
      }}>
      <RiveComponent style={props.style}/>
    </Flex>
  )
}
