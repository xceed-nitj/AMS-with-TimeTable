import React, { useState, useMemo, useCallback } from 'react';
import {
  Box, Container, Heading, Text, Tabs, TabList, TabPanels, Tab, TabPanel,
  VStack, HStack, Input, Button, Table, Thead, Tbody, Tr, Th, Td,
  Alert, AlertIcon, Badge, Accordion, AccordionItem, AccordionButton,
  AccordionPanel, AccordionIcon, Code, Divider, SimpleGrid, Card,
  CardHeader, CardBody, Stat, StatLabel, StatNumber, StatHelpText,
  useColorModeValue, Flex, Collapse, useDisclosure, useToast,
  Progress, CircularProgress, CircularProgressLabel
} from '@chakra-ui/react';
import { CheckIcon, CloseIcon, RepeatIcon } from '@chakra-ui/icons';
import WorkflowQuizTab from './workflowquiztab';
import MatrixQuizTab from './orderquiztab';

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max, dec = 2) => parseFloat((Math.random() * (max - min) + min).toFixed(dec));
const isClose = (ans, correct, tol = 0.05) => {
  const p = parseFloat(ans);
  return !isNaN(p) && Math.abs(p - correct) <= Math.abs(correct * tol) + 0.01;
};

const MathBlock = ({ children }) => (
  <Box bg={useColorModeValue('gray.100', 'gray.700')} p={4} borderRadius="md" my={4} textAlign="center" 
       fontFamily="'Cambria Math', Georgia, serif" fontSize={{ base: 'md', md: 'lg' }} overflowX="auto">
    {children}
  </Box>
);

const InlineMath = ({ children }) => (
  <Code bg={useColorModeValue('gray.100', 'gray.700')} px={2} py={1} borderRadius="sm" 
        fontFamily="'Cambria Math', Georgia, serif">{children}</Code>
);

const DualLineChart = ({ data1, data2, label1, label2, xLabel, yLabel, title, color1 = "#14b8a6", color2 = "#ef4444" }) => {
  const width = 500, height = 300;
  if (!data1.length || !data2.length) return null;
  const padding = { top: 40, right: 30, bottom: 50, left: 70 };
  const cW = width - padding.left - padding.right, cH = height - padding.top - padding.bottom;
  const allD = [...data1, ...data2];
  const xMax = Math.max(...allD.map(d => d.x)), yMax = Math.max(...allD.map(d => d.y));
  const xS = v => padding.left + (v / (xMax || 1)) * cW;
  const yS = v => padding.top + cH - (v / (yMax || 1)) * cH;
  const path1 = data1.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xS(d.x)} ${yS(d.y)}`).join(' ');
  const path2 = data2.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xS(d.x)} ${yS(d.y)}`).join(' ');
  
  return (
    <Box w="100%" overflowX="auto">
      {title && <Text fontWeight="bold" textAlign="center" mb={2}>{title}</Text>}
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ maxWidth: width, margin: '0 auto', display: 'block' }}>
        {[0,.25,.5,.75,1].map((t,i) => <line key={i} x1={padding.left} y1={padding.top+t*cH} x2={padding.left+cW} y2={padding.top+t*cH} stroke="#e5e7eb" strokeDasharray="4"/>)}
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top+cH} stroke="#374151" strokeWidth={2}/>
        <line x1={padding.left} y1={padding.top+cH} x2={padding.left+cW} y2={padding.top+cH} stroke="#374151" strokeWidth={2}/>
        <path d={path1} fill="none" stroke={color1} strokeWidth={3}/><path d={path2} fill="none" stroke={color2} strokeWidth={3}/>
        <rect x={padding.left+10} y={12} width={14} height={14} fill={color1} rx={2}/><text x={padding.left+30} y={23} fontSize="12" fill="#374151">{label1}</text>
        <rect x={padding.left+140} y={12} width={14} height={14} fill={color2} rx={2}/><text x={padding.left+160} y={23} fontSize="12" fill="#374151">{label2}</text>
        <text x={padding.left+cW/2} y={height-10} textAnchor="middle" fontSize="12" fill="#374151">{xLabel}</text>
        <text x={20} y={padding.top+cH/2} textAnchor="middle" fontSize="12" fill="#374151" transform={`rotate(-90,20,${padding.top+cH/2})`}>{yLabel}</text>
        {[0,.5,1].map((t,i) => <text key={i} x={padding.left-8} y={yS(t*yMax)+4} textAnchor="end" fontSize="10" fill="#6b7280">{(t*yMax).toFixed(1)}</text>)}
      </svg>
    </Box>
  );
};

const ProgressTracker = ({ progress, totalQuestions, problems }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const grayBg = useColorModeValue('gray.200', 'gray.600');
  const completed = Object.values(progress).filter(v => v).length;
  const pct = totalQuestions > 0 ? Math.round((completed / totalQuestions) * 100) : 0;
  const cats = [
    { key: 'mse', label: 'MSE', icon: '📊', color: 'blue', total: problems.mse.reduce((t,p) => t + p.parts.length, 0) },
    { key: 'gradient', label: 'G.Descent', icon: '⚡', color: 'green', total: problems.gradient.reduce((t,p) => t + p.parts.length, 0) },
    { key: 'scaling', label: 'Scaling', icon: '📏', color: 'teal', total: problems.scaling.reduce((t,p) => t + p.parts.length, 0) },
  { key: 'workflow', label: 'Workflow', icon: '🔀', color: 'orange', total: 4 },
  { key: 'matrix', label: 'Matrix Dims', icon: '📐', color: 'pink', total: 4 }
];

  return (
    <Card bg={cardBg} mb={6} shadow="lg" borderWidth="2px" borderColor={pct === 100 ? 'green.400' : 'purple.200'}>
      <CardBody>
        <Flex direction={{ base: 'column', lg: 'row' }} align="center" gap={6}>
          <Flex direction="column" align="center" minW="120px">
            <CircularProgress value={pct} size="100px" thickness="10px" color={pct === 100 ? 'green.400' : 'purple.500'} trackColor={grayBg}>
              <CircularProgressLabel fontWeight="bold" fontSize="xl">{pct}%</CircularProgressLabel>
            </CircularProgress>
            <Text mt={2} fontWeight="bold" color={pct === 100 ? 'green.500' : 'purple.600'}>{pct === 100 ? '🎉 Complete!' : 'Overall Progress'}</Text>
            <Text fontSize="sm" color="gray.500">{completed} / {totalQuestions} questions</Text>
          </Flex>
          <Box flex="1" w="100%">
            <SimpleGrid columns={{ base: 1, md: 5 }} spacing={2}>
              {cats.map(cat => {
                const done = Object.keys(progress).filter(k => k.startsWith(cat.key) && progress[k]).length;
                const catPct = cat.total > 0 ? Math.round((done / cat.total) * 100) : 0;
                const isDone = catPct === 100;
                return (
                  <Box key={cat.key} p={4} bg={isDone ? `${cat.color}.50` : useColorModeValue('gray.50', 'gray.700')} 
                       borderRadius="lg" borderWidth="2px" borderColor={isDone ? `${cat.color}.400` : 'transparent'}>
                    <Flex justify="space-between" align="center" mb={2}>
                      <HStack><Text fontSize="lg">{cat.icon}</Text><Text fontWeight="semibold" fontSize="sm">{cat.label}</Text></HStack>
                      {isDone && <Badge colorScheme="green" fontSize="xs">✓</Badge>}
                    </Flex>
                    <Progress value={catPct} colorScheme={isDone ? 'green' : cat.color} size="sm" borderRadius="full" bg={grayBg}/>
                    <Text fontSize="xs" color="gray.500" mt={1} textAlign="right">{done}/{cat.total} correct</Text>
                  </Box>
                );
              })}
            </SimpleGrid>
          </Box>
        </Flex>
        {pct === 100 && <Alert status="success" mt={4} borderRadius="md"><AlertIcon/><Box><Text fontWeight="bold">Congratulations! 🎉</Text><Text fontSize="sm">You completed all exercises!</Text></Box></Alert>}
      </CardBody>
    </Card>
  );
};

const Problem = ({ problem, index, category, progress, onCorrect }) => {
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState({});
  const { isOpen, onToggle } = useDisclosure();
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  const allDone = problem.parts.every(p => progress[`${category}_${index}_${p.key}`]);

  const check = (key, ans) => {
    const ok = isClose(answers[key], ans);
    setResults(r => ({ ...r, [key]: ok }));
    if (ok) onCorrect(`${category}_${index}_${key}`);
    toast({ title: ok ? 'Correct!' : 'Try again', status: ok ? 'success' : 'error', duration: 2000 });
  };

  const checkAll = () => {
    const newR = {};
    problem.parts.forEach(p => {
      const ok = isClose(answers[p.key], p.answer);
      newR[p.key] = ok;
      if (ok) onCorrect(`${category}_${index}_${p.key}`);
    });
    setResults(newR);
    toast({ title: Object.values(newR).every(v => v) ? 'All correct!' : 'Some need revision', status: Object.values(newR).every(v => v) ? 'success' : 'warning', duration: 3000 });
  };

  return (
    <Card bg={cardBg} mb={6} shadow="md" borderWidth="2px" borderColor={allDone ? 'green.400' : 'transparent'} position="relative">
      {allDone && <Badge colorScheme="green" position="absolute" top={2} right={2} px={2} py={1}>✓ Completed</Badge>}
      <CardHeader pb={2}><Heading size="md" color="purple.600">Problem {index + 1}</Heading></CardHeader>
      <CardBody pt={2}>
        <Text mb={4}>{problem.question}</Text>
        {problem.data && <Box overflowX="auto" mb={4}><Table size="sm" maxW="300px" mx="auto">
          <Thead><Tr>{problem.data.headers.map((h,i) => <Th key={i} bg="purple.100" textAlign="center">{h}</Th>)}</Tr></Thead>
          <Tbody>{problem.data.rows.map((r,i) => <Tr key={i}>{r.map((c,j) => <Td key={j} textAlign="center">{c}</Td>)}</Tr>)}</Tbody>
        </Table></Box>}
        {problem.params && <Alert status="info" mb={4} borderRadius="md"><AlertIcon/><Text fontSize="sm"><b>Given:</b> {problem.params}</Text></Alert>}
        <VStack spacing={3} align="stretch">
          {problem.parts.map(p => {
            const k = `${category}_${index}_${p.key}`, done = progress[k];
            return (
              <Flex key={p.key} direction={{ base: 'column', md: 'row' }} align={{ base: 'stretch', md: 'center' }} gap={3}>
                <HStack minW={{ md: '200px' }}>{done && <CheckIcon color="green.500"/>}<Text fontWeight="medium" color={done ? 'green.600' : 'inherit'}>{p.label}</Text></HStack>
                <Input type="number" step="any" value={answers[p.key] || ''} onChange={e => setAnswers(a => ({ ...a, [p.key]: e.target.value }))} 
                       placeholder="Answer" size="sm" maxW={{ base: '100%', md: '150px' }} isDisabled={done}
                       borderColor={done ? 'green.500' : results[p.key] === false ? 'red.500' : 'gray.300'}
                       bg={done ? 'green.50' : results[p.key] === false ? 'red.50' : 'white'}/>
                <Button size="sm" colorScheme={done ? 'green' : 'purple'} onClick={() => check(p.key, p.answer)} isDisabled={done}>{done ? 'Done' : 'Check'}</Button>
                {!done && results[p.key] === false && <Badge colorScheme="red"><CloseIcon mr={1}/>Try again</Badge>}
              </Flex>
            );
          })}
        </VStack>
        <HStack mt={4} spacing={3} flexWrap="wrap">
          <Button colorScheme="green" size="sm" onClick={checkAll} isDisabled={allDone}>{allDone ? 'All Completed' : 'Check All'}</Button>
          <Button colorScheme="gray" size="sm" onClick={onToggle}>{isOpen ? 'Hide' : 'Show'} Solution</Button>
        </HStack>
        <Collapse in={isOpen}>
          <Box mt={4} p={4} bg="yellow.50" borderRadius="md" borderWidth="1px" borderColor="yellow.200">
            <Text fontWeight="bold" color="yellow.800" mb={2}>Solution:</Text>
            <Text whiteSpace="pre-wrap" fontSize="sm">{problem.solution}</Text>
            <Divider my={3}/>{problem.parts.map(p => <Text key={p.key} fontSize="sm"><b>{p.label}</b> {p.answer.toFixed(4)}</Text>)}
          </Box>
        </Collapse>
      </CardBody>
    </Card>
  );
};

const Theory = () => {
  const cardBg = useColorModeValue('white', 'gray.800');
  return (
    <VStack spacing={6} align="stretch">
      <Card bg={cardBg}><CardHeader><Heading size="md" color="purple.600">Linear Regression</Heading></CardHeader>
        <CardBody pt={0}><Text mb={4}>Models relationship between <InlineMath>y</InlineMath> and <InlineMath>x</InlineMath>.</Text>
          <MathBlock>ŷ = h(x) = θ₀ + θ₁x</MathBlock>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={4}>
            <Box p={4} bg="purple.50" borderRadius="md"><Text fontWeight="bold" color="purple.700">θ₀ (Bias)</Text><Text fontSize="sm">Y-value when x=0</Text></Box>
            <Box p={4} bg="purple.50" borderRadius="md"><Text fontWeight="bold" color="purple.700">θ₁ (Weight)</Text><Text fontSize="sm">Change in y per unit x</Text></Box>
          </SimpleGrid>
        </CardBody></Card>
      <Card bg={cardBg}><CardHeader><Heading size="md" color="blue.600">MSE Cost Function</Heading></CardHeader>
        <CardBody pt={0}><Box bg="blue.50" p={4} borderRadius="md"><MathBlock>J(θ) = (1/2m) × Σ(h(x) - y)²</MathBlock></Box></CardBody></Card>
      <Card bg={cardBg}><CardHeader><Heading size="md" color="green.600">Gradient Descent</Heading></CardHeader>
        <CardBody pt={0}><Box bg="green.50" p={4} borderRadius="md"><MathBlock>θⱼ := θⱼ - α × (∂J/∂θⱼ)</MathBlock></Box>
          <Accordion allowMultiple mt={4}>
            <AccordionItem><AccordionButton><Box flex="1" textAlign="left" fontWeight="medium">∂J/∂θ₀</Box><AccordionIcon/></AccordionButton>
              <AccordionPanel><MathBlock>∂J/∂θ₀ = (1/m) × Σ(h(x) - y)</MathBlock></AccordionPanel></AccordionItem>
            <AccordionItem><AccordionButton><Box flex="1" textAlign="left" fontWeight="medium">∂J/∂θ₁</Box><AccordionIcon/></AccordionButton>
              <AccordionPanel><MathBlock>∂J/∂θ₁ = (1/m) × Σ(h(x) - y) × x</MathBlock></AccordionPanel></AccordionItem>
          </Accordion>
        </CardBody></Card>
      <Card bg={cardBg}><CardHeader><Heading size="md" color="teal.600">Feature Scaling</Heading></CardHeader>
        <CardBody pt={0}><SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <Box p={4} bg="teal.50" borderRadius="md"><Text fontWeight="bold" color="teal.700">Z-score</Text><MathBlock>x' = (x - μ) / σ</MathBlock></Box>
          <Box p={4} bg="cyan.50" borderRadius="md"><Text fontWeight="bold" color="cyan.700">Min-Max</Text><MathBlock>x' = (x - min) / (max - min)</MathBlock></Box>
        </SimpleGrid></CardBody></Card>
    </VStack>
  );
};

export default function LinearRegressionTutorial() {
  const [progress, setProgress] = useState({});
  const onCorrect = useCallback(k => setProgress(p => ({ ...p, [k]: true })), []);
  const cardBg = useColorModeValue('white', 'gray.800');

  const { problems, scalingData, totalQuestions } = useMemo(() => {
    const mse = [], grad = [], scale = [];
    
    // MSE 1
    const d1 = [[randInt(1,3),randInt(2,6)],[randInt(4,6),randInt(8,14)],[randInt(7,9),randInt(14,20)]];
    const t0=randFloat(.5,2),t1=randFloat(1,2.5),m=d1.length;
    let sum=0; const det=d1.map(([x,y])=>{const h=t0+t1*x,sq=(h-y)**2;sum+=sq;return{x,y,h,sq}});
    const cost=sum/(2*m);
    mse.push({question:"Calculate MSE cost J(θ).",data:{headers:['x','y'],rows:d1},params:`θ₀=${t0}, θ₁=${t1}`,
      parts:[{key:'cost',label:'J(θ)=',answer:cost}],solution:det.map((d,i)=>`Point ${i+1}: h(${d.x})=${d.h.toFixed(3)}, error²=${d.sq.toFixed(4)}`).join('\n')+`\nJ(θ)=${cost.toFixed(4)}`});
    
    // MSE 2
    const d2=[[randInt(0,2),randInt(1,5)],[randInt(3,5),randInt(7,12)],[randInt(6,8),randInt(14,20)]];
    const t0a=randFloat(0,1),t1a=randFloat(1.5,2.5),t0b=randFloat(1,3),t1b=randFloat(1,2);
    let cA=0,cB=0;d2.forEach(([x,y])=>{cA+=(t0a+t1a*x-y)**2;cB+=(t0b+t1b*x-y)**2});cA/=(2*d2.length);cB/=(2*d2.length);
    mse.push({question:"Compare J(θ) for two parameter sets.",data:{headers:['x','y'],rows:d2},params:`A: θ₀=${t0a},θ₁=${t1a} | B: θ₀=${t0b},θ₁=${t1b}`,
      parts:[{key:'cA',label:'J(θ) A=',answer:cA},{key:'cB',label:'J(θ) B=',answer:cB}],solution:`A: ${cA.toFixed(4)}\nB: ${cB.toFixed(4)}\n${cA<cB?'A':'B'} is better`});
    
    // GD 1
    const gd1=[[randInt(1,3),randInt(2,6)],[randInt(4,6),randInt(8,14)],[randInt(7,9),randInt(14,20)]];
    const a1=randFloat(.01,.1),m1=gd1.length;let se=0,sex=0;gd1.forEach(([x,y])=>{const e=-y;se+=e;sex+=e*x});
    const g0=se/m1,g1=sex/m1,nt0=-a1*g0,nt1=-a1*g1;
    grad.push({question:"Perform ONE gradient descent iteration.",data:{headers:['x','y'],rows:gd1},params:`θ₀=0, θ₁=0, α=${a1}`,
      parts:[{key:'g0',label:'∂J/∂θ₀=',answer:g0},{key:'g1',label:'∂J/∂θ₁=',answer:g1},{key:'nt0',label:'New θ₀=',answer:nt0},{key:'nt1',label:'New θ₁=',answer:nt1}],
      solution:`∂J/∂θ₀=${g0.toFixed(4)}\n∂J/∂θ₁=${g1.toFixed(4)}\nθ₀=${nt0.toFixed(4)}\nθ₁=${nt1.toFixed(4)}`});
    
    // GD 2
    const gd2=[[randInt(1,2),randInt(3,6)],[randInt(3,4),randInt(7,10)]];let gt0=0,gt1=0;const iters=randInt(2,3);
    for(let i=0;i<iters;i++){let e0=0,e1=0;gd2.forEach(([x,y])=>{const e=gt0+gt1*x-y;e0+=e;e1+=e*x});gt0-=.1*e0/gd2.length;gt1-=.1*e1/gd2.length}
    grad.push({question:`Perform ${iters} iterations.`,data:{headers:['x','y'],rows:gd2},params:`θ₀=0, θ₁=0, α=0.1`,
      parts:[{key:'ft0',label:'Final θ₀=',answer:gt0},{key:'ft1',label:'Final θ₁=',answer:gt1}],solution:`After ${iters} iters:\nθ₀=${gt0.toFixed(4)}\nθ₁=${gt1.toFixed(4)}`});
    
    // GD 3
    const gd3=[[randInt(1,2),randInt(2,5)],[randInt(3,5),randInt(6,12)],[randInt(6,8),randInt(13,18)]];
    const ti0=randFloat(0,1),ti1=randFloat(.5,1.5),a3=randFloat(.01,.05),m3=gd3.length;
    let ci=0;gd3.forEach(([x,y])=>{ci+=(ti0+ti1*x-y)**2});ci/=(2*m3);
    let e30=0,e31=0;gd3.forEach(([x,y])=>{const e=ti0+ti1*x-y;e30+=e;e31+=e*x});
    const n30=ti0-a3*e30/m3,n31=ti1-a3*e31/m3;let cf=0;gd3.forEach(([x,y])=>{cf+=(n30+n31*x-y)**2});cf/=(2*m3);
    grad.push({question:"Verify cost decreased after one iteration.",data:{headers:['x','y'],rows:gd3},params:`θ₀=${ti0},θ₁=${ti1},α=${a3}`,
      parts:[{key:'ci',label:'Initial J=',answer:ci},{key:'n0',label:'New θ₀=',answer:n30},{key:'n1',label:'New θ₁=',answer:n31},{key:'cf',label:'New J=',answer:cf}],
      solution:`Initial: ${ci.toFixed(4)}\nNew: ${cf.toFixed(4)}\nDecreased by ${(ci-cf).toFixed(4)}`});
    
    // Scale 1 - Z-score
    const v1=[randInt(100,200),randInt(300,400),randInt(500,600),randInt(700,800)];
    const mu=v1.reduce((a,b)=>a+b,0)/v1.length,sig=Math.sqrt(v1.reduce((s,v)=>s+(v-mu)**2,0)/v1.length);
    const z1=(v1[0]-mu)/sig,z4=(v1[3]-mu)/sig;
    scale.push({question:`Z-score normalize: [${v1.join(',')}]`,params:`x'=(x-μ)/σ`,
      parts:[{key:'mu',label:'μ=',answer:mu},{key:'sig',label:'σ=',answer:sig},{key:'z1',label:`Norm ${v1[0]}=`,answer:z1},{key:'z4',label:`Norm ${v1[3]}=`,answer:z4}],
      solution:`μ=${mu.toFixed(2)}, σ=${sig.toFixed(4)}\n${v1[0]}: ${z1.toFixed(4)}\n${v1[3]}: ${z4.toFixed(4)}`});
    
    // Scale 2 - MinMax
    const v2=[randInt(10,30),randInt(40,60),randInt(70,90),randInt(100,120)];
    const mn=Math.min(...v2),mx=Math.max(...v2),rng=mx-mn,s1=(v2[0]-mn)/rng,s2=(v2[1]-mn)/rng;
    scale.push({question:`Min-Max scale: [${v2.join(',')}]`,params:`x'=(x-min)/(max-min)`,
      parts:[{key:'mn',label:'min=',answer:mn},{key:'mx',label:'max=',answer:mx},{key:'s1',label:`Scale ${v2[0]}=`,answer:s1},{key:'s2',label:`Scale ${v2[1]}=`,answer:s2}],
      solution:`min=${mn}, max=${mx}\n${v2[0]}: ${s1.toFixed(4)}\n${v2[1]}: ${s2.toFixed(4)}`});
    
    let total=0;mse.forEach(p=>total+=p.parts.length);grad.forEach(p=>total+=p.parts.length);scale.forEach(p=>total+=p.parts.length);total += 4;
    
    // Convergence data
    const sim=[{x:randInt(1,10),y:randInt(100,200)},{x:randInt(20,30),y:randInt(300,400)},{x:randInt(40,50),y:randInt(500,600)},{x:randInt(60,70),y:randInt(700,800)},{x:randInt(80,100),y:randInt(900,1000)}];
    let ns0=0,ns1=0;const woS=[];for(let i=0;i<=50;i++){let c=0;sim.forEach(d=>{c+=(ns0+ns1*d.x-d.y)**2});c/=(2*sim.length);woS.push({x:i,y:c});let g0=0,g1=0;sim.forEach(d=>{const e=ns0+ns1*d.x-d.y;g0+=e;g1+=e*d.x});ns0-=.00001*g0/sim.length;ns1-=.00001*g1/sim.length}
    const xM=sim.reduce((s,d)=>s+d.x,0)/sim.length,xS=Math.sqrt(sim.reduce((s,d)=>s+(d.x-xM)**2,0)/sim.length);
    const yM=sim.reduce((s,d)=>s+d.y,0)/sim.length,yS=Math.sqrt(sim.reduce((s,d)=>s+(d.y-yM)**2,0)/sim.length);
    const sD=sim.map(d=>({x:(d.x-xM)/xS,y:(d.y-yM)/yS}));let ws0=0,ws1=0;const wS=[];
    for(let i=0;i<=50;i++){let c=0;sD.forEach(d=>{c+=(ws0+ws1*d.x-d.y)**2});c/=(2*sD.length);wS.push({x:i,y:c});let g0=0,g1=0;sD.forEach(d=>{const e=ws0+ws1*d.x-d.y;g0+=e;g1+=e*d.x});ws0-=.1*g0/sD.length;ws1-=.1*g1/sD.length}
    
    return{problems:{mse,gradient:grad,scaling:scale},scalingData:{withScaling:wS,withoutScaling:woS},totalQuestions:total};
  },[]);

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50','gray.900')} py={8}>
      <Container maxW="container.lg">
        <VStack spacing={4} mb={6} textAlign="center">
          <Heading size={{base:'xl',md:'2xl'}} color="purple.600">Linear Regression Tutorial</Heading>
          <Text color="gray.600">Interactive learning with random problems</Text>
          <Button leftIcon={<RepeatIcon/>} colorScheme="purple" variant="outline" size="sm" onClick={()=>window.location.reload()}>New Problems</Button>
        </VStack>
        <ProgressTracker progress={progress} totalQuestions={totalQuestions} problems={problems}/>
        <Tabs colorScheme="purple" variant="enclosed" isLazy>
          <TabList flexWrap="wrap">
            <Tab fontWeight="semibold">📚 Theory</Tab>
            <Tab fontWeight="semibold">📊 MSE{Object.keys(progress).filter(k=>k.startsWith('mse')&&progress[k]).length===problems.mse.reduce((t,p)=>t+p.parts.length,0)&&<Badge ml={2} colorScheme="green">✓</Badge>}</Tab>
            <Tab fontWeight="semibold">⚡ Gradient{Object.keys(progress).filter(k=>k.startsWith('gradient')&&progress[k]).length===problems.gradient.reduce((t,p)=>t+p.parts.length,0)&&<Badge ml={2} colorScheme="green">✓</Badge>}</Tab>
            <Tab fontWeight="semibold">📏 Scaling{Object.keys(progress).filter(k=>k.startsWith('scaling')&&progress[k]).length===problems.scaling.reduce((t,p)=>t+p.parts.length,0)&&<Badge ml={2} colorScheme="green">✓</Badge>}</Tab>
            <Tab fontWeight="semibold">🔀 Workflow{Object.keys(progress).filter(k => k.startsWith('workflow') && progress[k]).length === 4 && <Badge ml={2} colorScheme="green">✓</Badge>}</Tab>
            <Tab fontWeight="semibold">📐 Matrix{Object.keys(progress).filter(k => k.startsWith('matrix') && progress[k]).length === 4 && <Badge ml={2} colorScheme="green">✓</Badge>}</Tab>
          </TabList>
          <TabPanels>
            <TabPanel><Theory/></TabPanel>
            <TabPanel><Alert status="info" mb={6} borderRadius="md"><AlertIcon/><Text fontSize="sm"><b>MSE:</b> J(θ)=(1/2m)×Σ(h(x)-y)²</Text></Alert>
              {problems.mse.map((p,i)=><Problem key={i} problem={p} index={i} category="mse" progress={progress} onCorrect={onCorrect}/>)}</TabPanel>
            <TabPanel><Alert status="info" mb={6} borderRadius="md"><AlertIcon/><Text fontSize="sm"><b>Gradient Descent:</b> Update all parameters simultaneously!</Text></Alert>
              {problems.gradient.map((p,i)=><Problem key={i} problem={p} index={i} category="gradient" progress={progress} onCorrect={onCorrect}/>)}</TabPanel>
            <TabPanel><Alert status="info" mb={6} borderRadius="md"><AlertIcon/><Text fontSize="sm"><b>Feature Scaling:</b> Normalize for faster convergence</Text></Alert>
               
              <Card bg={cardBg} mb={6}><CardHeader><Heading size="md" color="teal.600">Convergence Comparison</Heading></CardHeader>
                <CardBody><DualLineChart data1={scalingData.withScaling} data2={scalingData.withoutScaling} label1="With Scaling (α=0.1)" label2="Without (α=0.00001)" xLabel="Iterations" yLabel="Cost J(θ)" title="Cost Over Iterations"/>
                  <SimpleGrid columns={{base:1,md:2}} spacing={4} mt={4}>
                    <Stat p={4} bg="teal.50" borderRadius="md"><StatLabel color="teal.700">With Scaling</StatLabel><StatNumber color="teal.600">{scalingData.withScaling[50]?.y.toFixed(4)}</StatNumber><StatHelpText>Final cost</StatHelpText></Stat>
                    <Stat p={4} bg="red.50" borderRadius="md"><StatLabel color="red.700">Without Scaling</StatLabel><StatNumber color="red.600">{scalingData.withoutScaling[50]?.y.toFixed(1)}</StatNumber><StatHelpText>Final cost</StatHelpText></Stat>
                  </SimpleGrid>
                </CardBody></Card>
              {problems.scaling.map((p,i)=><Problem key={i} problem={p} index={i} category="scaling" progress={progress} onCorrect={onCorrect}/>)}</TabPanel>
         <TabPanel>
    <WorkflowQuizTab progress={progress} onCorrect={onCorrect} />
  </TabPanel>
  <TabPanel>
  <MatrixQuizTab progress={progress} onCorrect={onCorrect} />
</TabPanel>
          </TabPanels>
        
        </Tabs>
        <Box textAlign="center" mt={8} color="gray.500" fontSize="sm"><Text>Problems regenerate on page load</Text></Box>
      </Container>
    </Box>
  );
}