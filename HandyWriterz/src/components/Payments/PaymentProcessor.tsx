import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  HStack,
  Input,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Select,
  Divider,
  useToast,
  Grid,
  GridItem,
  Badge,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Flex,
  Stack,
  RadioGroup,
  Radio,
  Image,
  Alert,
  AlertIcon,
  Spinner,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import {
  FiCreditCard,
  FiDollarSign,
  FiCheck,
  FiX,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiLock,
  FiShield,
  FiDownload,
  FiCornerUpLeft
} from 'react-icons/fi';
import { createPayment, getUserPayments, updatePaymentStatus } from '../../lib/databaseService';

// Payment plan interface
interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  interval: 'one-time' | 'monthly' | 'annual';
  description: string;
  features: string[];
  isPopular?: boolean;
}

// Payment method interface
interface PaymentMethod {
  id: string;
  type: 'credit' | 'paypal' | 'bank';
  last4?: string;
  expMonth?: number;
  expYear?: number;
  brand?: string;
  email?: string;
  bankName?: string;
  isDefault: boolean;
}

// Payment record interface
interface Payment {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded';
  payment_method: string;
  created_at: string;
  metadata: {
    plan_id?: string;
    plan_name?: string;
    invoice_id?: string;
    receipt_url?: string;
  };
}

// Credit card form state
interface CardDetails {
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  cardName: string;
}

// Payment plans data - would come from your database in a real app
const paymentPlans: PaymentPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 19.99,
    interval: 'monthly',
    description: 'Perfect for individuals',
    features: [
      '5 document uploads per month',
      'Basic support',
      'Access to essential services',
      '1 user account'
    ]
  },
  {
    id: 'pro',
    name: 'Professional',
    price: 49.99,
    interval: 'monthly',
    description: 'Ideal for professionals',
    isPopular: true,
    features: [
      'Unlimited document uploads',
      'Priority support',
      'Access to all services',
      'Up to 3 user accounts',
      'Advanced analytics'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99.99,
    interval: 'monthly',
    description: 'For growing businesses',
    features: [
      'Unlimited everything',
      'Dedicated support',
      'Custom solutions',
      'Unlimited user accounts',
      'Advanced security features',
      'API access'
    ]
  }
];

// Mock saved payment methods - in a real app, these would be fetched from Stripe
const mockSavedPaymentMethods: PaymentMethod[] = [
  {
    id: 'pm_1',
    type: 'credit',
    last4: '4242',
    expMonth: 12,
    expYear: 2025,
    brand: 'Visa',
    isDefault: true
  },
  {
    id: 'pm_2',
    type: 'paypal',
    email: 'user@example.com',
    isDefault: false
  }
];

// Format currency
const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
};

// Format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(date);
};

// Get payment status badge props
const getStatusBadgeProps = (status: Payment['status']) => {
  const statusMap = {
    pending: { colorScheme: 'yellow', icon: FiClock, text: 'Pending' },
    processing: { colorScheme: 'blue', icon: FiClock, text: 'Processing' },
    succeeded: { colorScheme: 'green', icon: FiCheckCircle, text: 'Succeeded' },
    failed: { colorScheme: 'red', icon: FiX, text: 'Failed' },
    refunded: { colorScheme: 'purple', icon: FiCornerUpLeft, text: 'Refunded' }
  };
  
  return statusMap[status] || statusMap.pending;
};

// Status Badge component
const StatusBadge: React.FC<{ status: Payment['status'] }> = ({ status }) => {
  const { colorScheme, icon, text } = getStatusBadgeProps(status);
  
  return (
    <Badge 
      colorScheme={colorScheme} 
      display="flex" 
      alignItems="center" 
      px={2}
      py={1}
      borderRadius="full"
    >
      <Box as={icon} mr={1} />
      {text}
    </Badge>
  );
};

// Plan Selector Component
const PlanSelector: React.FC<{ 
  plans: PaymentPlan[];
  selectedPlan: string;
  onSelectPlan: (planId: string) => void;
}> = ({ plans, selectedPlan, onSelectPlan }) => {
  const cardBgColor = useColorModeValue('white', 'gray.800');
  const selectedCardBgColor = useColorModeValue('blue.50', 'blue.900');
  const selectedCardBorderColor = useColorModeValue('blue.500', 'blue.400');
  const popularBgColor = useColorModeValue('blue.100', 'blue.800');
  
  return (
    <Grid 
      templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} 
      gap={4}
      w="100%"
    >
      {plans.map(plan => (
        <Card 
          key={plan.id}
          bg={selectedPlan === plan.id ? selectedCardBgColor : cardBgColor}
          borderWidth="1px"
          borderColor={selectedPlan === plan.id ? selectedCardBorderColor : 'inherit'}
          cursor="pointer"
          onClick={() => onSelectPlan(plan.id)}
          position="relative"
          overflow="hidden"
          transition="all 0.2s"
          _hover={{
            transform: "translateY(-5px)",
            boxShadow: "lg"
          }}
        >
          {plan.isPopular && (
            <Box
              position="absolute"
              top={0}
              right={0}
              bg={popularBgColor}
              px={3}
              py={1}
              borderBottomLeftRadius="md"
              fontWeight="bold"
              fontSize="sm"
            >
              Most Popular
            </Box>
          )}
          
          <CardHeader pb={0}>
            <Heading size="md">{plan.name}</Heading>
            <HStack mt={2}>
              <Text fontSize="3xl" fontWeight="bold">
                {formatCurrency(plan.price)}
              </Text>
              <Text fontSize="sm" color="gray.500">
                /{plan.interval}
              </Text>
            </HStack>
            <Text fontSize="sm" color="gray.500" mt={1}>
              {plan.description}
            </Text>
          </CardHeader>
          
          <CardBody>
            <VStack align="start" spacing={2}>
              {plan.features.map((feature, index) => (
                <HStack key={index} spacing={2} align="start">
                  <Box as={FiCheck} color="green.500" mt={1} />
                  <Text>{feature}</Text>
                </HStack>
              ))}
            </VStack>
          </CardBody>
          
          <CardFooter pt={0}>
            <Button 
              colorScheme={selectedPlan === plan.id ? "blue" : "gray"}
              variant={selectedPlan === plan.id ? "solid" : "outline"}
              w="100%"
              leftIcon={selectedPlan === plan.id ? <FiCheck /> : undefined}
            >
              {selectedPlan === plan.id ? "Selected" : "Select Plan"}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </Grid>
  );
};

// Payment Method Selector Component
const PaymentMethodSelector: React.FC<{
  savedMethods: PaymentMethod[];
  selectedMethod: string | null;
  onSelectMethod: (methodId: string | null) => void;
}> = ({ savedMethods, selectedMethod, onSelectMethod }) => {
  const cardBgColor = useColorModeValue('white', 'gray.800');
  
  return (
    <VStack spacing={4} align="stretch" w="100%">
      <RadioGroup value={selectedMethod || ''} onChange={(value) => onSelectMethod(value || null)}>
        <Stack direction="column" spacing={3}>
          {savedMethods.map(method => (
            <Box
              key={method.id}
              borderWidth="1px"
              borderRadius="md"
              p={4}
              bg={cardBgColor}
            >
              <Radio value={method.id}>
                <Flex align="center">
                  {method.type === 'credit' && (
                    <HStack spacing={2}>
                      <Box as={FiCreditCard} />
                      <Text fontWeight="medium">
                        {method.brand} **** {method.last4}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        Expires {method.expMonth}/{method.expYear}
                      </Text>
                      {method.isDefault && (
                        <Badge colorScheme="green" ml={2}>Default</Badge>
                      )}
                    </HStack>
                  )}
                  
                  {method.type === 'paypal' && (
                    <HStack spacing={2}>
                      <Image src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg" h="20px" alt="PayPal" />
                      <Text fontWeight="medium">
                        PayPal
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        {method.email}
                      </Text>
                      {method.isDefault && (
                        <Badge colorScheme="green" ml={2}>Default</Badge>
                      )}
                    </HStack>
                  )}
                  
                  {method.type === 'bank' && (
                    <HStack spacing={2}>
                      <Box as={FiDollarSign} />
                      <Text fontWeight="medium">
                        {method.bankName}
                      </Text>
                      {method.isDefault && (
                        <Badge colorScheme="green" ml={2}>Default</Badge>
                      )}
                    </HStack>
                  )}
                </Flex>
              </Radio>
            </Box>
          ))}
          
          <Box
            borderWidth="1px"
            borderRadius="md"
            p={4}
            borderStyle="dashed"
            bg={cardBgColor}
          >
            <Radio value="new">
              <HStack spacing={2}>
                <Box as={FiCreditCard} />
                <Text fontWeight="medium">
                  Use a new payment method
                </Text>
              </HStack>
            </Radio>
          </Box>
        </Stack>
      </RadioGroup>
    </VStack>
  );
};

// Credit Card Form Component
const CreditCardForm: React.FC<{
  onSubmit: (cardDetails: CardDetails) => void;
}> = ({ onSubmit }) => {
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    cardName: ''
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CardDetails, string>>>({});
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;
    
    // Format card number with spaces
    if (name === 'cardNumber') {
      formattedValue = value
        .replace(/\s/g, '')
        .replace(/(\d{4})/g, '$1 ')
        .trim()
        .slice(0, 19);
    }
    
    // Format expiry date with slash
    if (name === 'cardExpiry') {
      formattedValue = value
        .replace(/\//g, '')
        .replace(/(\d{2})(\d{0,2})/, '$1/$2')
        .slice(0, 5);
    }
    
    // Format CVC to only numbers
    if (name === 'cardCvc') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }
    
    setCardDetails(prev => ({
      ...prev,
      [name]: formattedValue
    }));
    
    // Clear error when user types
    if (errors[name as keyof CardDetails]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    // Validate card number (simple check: 16 digits without spaces)
    if (cardDetails.cardNumber.replace(/\s/g, '').length !== 16) {
      newErrors.cardNumber = 'Please enter a valid 16-digit card number';
    }
    
    // Validate expiry (format: MM/YY where MM is 01-12 and YY is >= current year)
    const expiryMatch = cardDetails.cardExpiry.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
    if (!expiryMatch) {
      newErrors.cardExpiry = 'Please enter a valid expiry date (MM/YY)';
    } else {
      const month = parseInt(expiryMatch[1], 10);
      const year = parseInt(`20${expiryMatch[2]}`, 10);
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      
      if (year < currentYear || (year === currentYear && month < currentMonth)) {
        newErrors.cardExpiry = 'Your card has expired';
      }
    }
    
    // Validate CVC (3-4 digits)
    if (!/^\d{3,4}$/.test(cardDetails.cardCvc)) {
      newErrors.cardCvc = 'Please enter a valid 3 or 4 digit CVC';
    }
    
    // Validate name
    if (!cardDetails.cardName.trim()) {
      newErrors.cardName = 'Please enter the name on your card';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(cardDetails);
    }
  };
  
  return (
    <Box as="form" onSubmit={handleSubmit} w="100%">
      <VStack spacing={4} align="stretch">
        <FormControl isRequired isInvalid={!!errors.cardName}>
          <FormLabel>Name on Card</FormLabel>
          <Input
            name="cardName"
            placeholder="John Smith"
            value={cardDetails.cardName}
            onChange={handleChange}
          />
          <FormErrorMessage>{errors.cardName}</FormErrorMessage>
        </FormControl>
        
        <FormControl isRequired isInvalid={!!errors.cardNumber}>
          <FormLabel>Card Number</FormLabel>
          <Input
            name="cardNumber"
            placeholder="1234 5678 9012 3456"
            value={cardDetails.cardNumber}
            onChange={handleChange}
            maxLength={19}
          />
          <FormErrorMessage>{errors.cardNumber}</FormErrorMessage>
        </FormControl>
        
        <Grid templateColumns="1fr 1fr" gap={4}>
          <FormControl isRequired isInvalid={!!errors.cardExpiry}>
            <FormLabel>Expiry Date</FormLabel>
            <Input
              name="cardExpiry"
              placeholder="MM/YY"
              value={cardDetails.cardExpiry}
              onChange={handleChange}
              maxLength={5}
            />
            <FormErrorMessage>{errors.cardExpiry}</FormErrorMessage>
          </FormControl>
          
          <FormControl isRequired isInvalid={!!errors.cardCvc}>
            <FormLabel>CVC</FormLabel>
            <Input
              name="cardCvc"
              placeholder="123"
              value={cardDetails.cardCvc}
              onChange={handleChange}
              maxLength={4}
            />
            <FormErrorMessage>{errors.cardCvc}</FormErrorMessage>
          </FormControl>
        </Grid>
        
        <HStack mt={2} spacing={1} fontSize="sm" color="gray.500">
          <Box as={FiLock} />
          <Text>Your payment is secured with SSL encryption</Text>
        </HStack>
        
        <Button mt={4} colorScheme="blue" type="submit" leftIcon={<FiCreditCard />}>
          Pay with Credit Card
        </Button>
      </VStack>
    </Box>
  );
};

// Payment History Component
const PaymentHistory: React.FC<{
  payments: Payment[];
  loading: boolean;
}> = ({ payments, loading }) => {
  const cardBgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  if (loading) {
    return (
      <Flex justify="center" align="center" h="200px">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }
  
  if (payments.length === 0) {
    return (
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        <Text>You don't have any payment history yet.</Text>
      </Alert>
    );
  }
  
  return (
    <VStack spacing={4} align="stretch">
      {payments.map(payment => (
        <Box
          key={payment.id}
          p={4}
          borderWidth="1px"
          borderRadius="md"
          bg={cardBgColor}
        >
          <Grid 
            templateColumns={{ base: "1fr", md: "3fr 1fr 1fr 1fr" }} 
            gap={4}
            alignItems="center"
          >
            <GridItem>
              <VStack align="start" spacing={1}>
                <Text fontWeight="bold">
                  {payment.metadata.plan_name || 'Payment'}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {formatDate(payment.created_at)}
                </Text>
                {payment.metadata.invoice_id && (
                  <Text fontSize="sm" color="gray.500">
                    Invoice: {payment.metadata.invoice_id}
                  </Text>
                )}
              </VStack>
            </GridItem>
            
            <GridItem>
              <Text fontWeight="bold">
                {formatCurrency(payment.amount, payment.currency)}
              </Text>
            </GridItem>
            
            <GridItem>
              <StatusBadge status={payment.status} />
            </GridItem>
            
            <GridItem justifySelf={{ base: "start", md: "end" }}>
              <HStack>
                {payment.metadata.receipt_url && (
                  <Tooltip label="Download Receipt">
                    <IconButton
                      aria-label="Download receipt"
                      icon={<FiDownload />}
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(payment.metadata.receipt_url, '_blank')}
                    />
                  </Tooltip>
                )}
              </HStack>
            </GridItem>
          </Grid>
        </Box>
      ))}
    </VStack>
  );
};

// Success Modal Component
const SuccessModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  paymentDetails: {
    planName: string;
    amount: number;
    date: string;
  } | null;
}> = ({ isOpen, onClose, paymentDetails }) => {
  if (!paymentDetails) return null;
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader bg="green.500" color="white" borderTopRadius="md">
          <Flex align="center">
            <Box as={FiCheckCircle} mr={2} />
            Payment Successful
          </Flex>
        </ModalHeader>
        <ModalCloseButton color="white" />
        
        <ModalBody py={6}>
          <VStack spacing={4} align="stretch">
            <Box textAlign="center">
              <Heading size="md" mb={2}>Thank You For Your Payment!</Heading>
              <Text>Your payment has been processed successfully.</Text>
            </Box>
            
            <Divider />
            
            <Grid templateColumns="1fr 1fr" gap={2}>
              <GridItem>
                <Text color="gray.500">Plan:</Text>
              </GridItem>
              <GridItem>
                <Text fontWeight="bold">{paymentDetails.planName}</Text>
              </GridItem>
              
              <GridItem>
                <Text color="gray.500">Amount:</Text>
              </GridItem>
              <GridItem>
                <Text fontWeight="bold">{formatCurrency(paymentDetails.amount)}</Text>
              </GridItem>
              
              <GridItem>
                <Text color="gray.500">Date:</Text>
              </GridItem>
              <GridItem>
                <Text fontWeight="bold">{paymentDetails.date}</Text>
              </GridItem>
            </Grid>
            
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Text fontSize="sm">
                A receipt has been sent to your email address.
              </Text>
            </Alert>
          </VStack>
        </ModalBody>
        
        <ModalFooter>
          <Button colorScheme="green" onClick={onClose} leftIcon={<FiCheck />}>
            Continue
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// Main PaymentProcessor Component
interface PaymentProcessorProps {
  onSuccess?: (paymentDetails: any) => void;
  onCancel?: () => void;
  preSelectedPlanId?: string;
  allowPlanChange?: boolean;
}

const PaymentProcessor: React.FC<PaymentProcessorProps> = ({
  onSuccess,
  onCancel,
  preSelectedPlanId,
  allowPlanChange = true
}) => {
  const [selectedPlan, setSelectedPlan] = useState<string>(preSelectedPlanId || paymentPlans[0].id);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(
    mockSavedPaymentMethods.length > 0 ? mockSavedPaymentMethods[0].id : null
  );
  const [paymentStep, setPaymentStep] = useState<'plan' | 'method' | 'processing'>('plan');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  
  const { user } = useAuth();
  const toast = useToast();
  
  const { isOpen: isSuccessOpen, onOpen: onSuccessOpen, onClose: onSuccessClose } = useDisclosure();
  const [successDetails, setSuccessDetails] = useState<{
    planName: string;
    amount: number;
    date: string;
  } | null>(null);
  
  // Get the selected plan object
  const plan = paymentPlans.find(p => p.id === selectedPlan);
  
  // Load payment history
  const loadPaymentHistory = async () => {
    if (!user) return;
    
    setIsLoadingHistory(true);
    
    try {
      const payments = await getUserPayments(user.id);
      setPaymentHistory(payments as Payment[]);
    } catch (err) {
      console.error('Error loading payment history:', err);
      toast({
        title: 'Error loading payment history',
        description: err instanceof Error ? err.message : 'An unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };
  
  // Load payment history on component mount
  useEffect(() => {
    if (activeTab === 1) {
      loadPaymentHistory();
    }
  }, [activeTab, user]);
  
  // Handle plan selection
  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
  };
  
  // Handle payment method selection
  const handleSelectPaymentMethod = (methodId: string | null) => {
    setSelectedPaymentMethod(methodId);
  };
  
  // Handle continue to payment method step
  const handleContinueToPayment = () => {
    if (!plan) return;
    setPaymentStep('method');
  };
  
  // Handle back to plan selection
  const handleBackToPlan = () => {
    setPaymentStep('plan');
    setPaymentError(null);
  };
  
  // Handle credit card submission
  const handleCardSubmit = async (cardDetails: CardDetails) => {
    if (!user || !plan) return;
    
    setIsProcessing(true);
    setPaymentError(null);
    
    try {
      // In a real app, you would:
      // 1. Create a payment intent/setup with Stripe
      // 2. Confirm the payment with the card details
      // 3. Handle the payment result
      
      // For this demo, simulate a payment process
      setPaymentStep('processing');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create payment record in the database
      const paymentResult = await createPayment({
        amount: plan.price,
        currency: 'USD',
        payment_method: selectedPaymentMethod === 'new' 
          ? `${cardDetails.cardNumber.slice(-4)}` 
          : selectedPaymentMethod || 'unknown',
        metadata: {
          plan_id: plan.id,
          plan_name: plan.name
        }
      });
      
      // Show success message
      setSuccessDetails({
        planName: plan.name,
        amount: plan.price,
        date: new Date().toLocaleDateString()
      });
      
      onSuccessOpen();
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess({
          planId: plan.id,
          planName: plan.name,
          amount: plan.price,
          paymentId: paymentResult.id
        });
      }
      
    } catch (err) {
      console.error('Payment error:', err);
      setPaymentError(err instanceof Error ? err.message : 'An unknown error occurred during payment processing');
      setPaymentStep('method');
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <Box>
      <Tabs 
        variant="enclosed" 
        colorScheme="blue" 
        mb={6}
        index={activeTab}
        onChange={setActiveTab}
      >
        <TabList>
          <Tab>Make a Payment</Tab>
          <Tab>Payment History</Tab>
        </TabList>
        
        <TabPanels>
          {/* Payment Tab */}
          <TabPanel p={0} pt={6}>
            {paymentStep === 'plan' && (
              <VStack spacing={8} align="stretch">
                <Heading size="lg" mb={2}>
                  {allowPlanChange ? 'Choose Your Plan' : 'Confirm Your Plan'}
                </Heading>
                
                {allowPlanChange ? (
                  <PlanSelector 
                    plans={paymentPlans} 
                    selectedPlan={selectedPlan} 
                    onSelectPlan={handleSelectPlan} 
                  />
                ) : (
                  <Box 
                    p={6} 
                    borderWidth="1px" 
                    borderRadius="md" 
                    bg={useColorModeValue('gray.50', 'gray.800')}
                  >
                    <Heading size="md" mb={4}>{plan?.name} Plan</Heading>
                    <HStack mb={4}>
                      <Text fontSize="2xl" fontWeight="bold">
                        {formatCurrency(plan?.price || 0)}
                      </Text>
                      <Text fontSize="md" color="gray.500">
                        /{plan?.interval}
                      </Text>
                    </HStack>
                    
                    <VStack align="start" spacing={2}>
                      {plan?.features.map((feature, index) => (
                        <HStack key={index} spacing={2}>
                          <Box as={FiCheck} color="green.500" />
                          <Text>{feature}</Text>
                        </HStack>
                      ))}
                    </VStack>
                  </Box>
                )}
                
                <Button 
                  colorScheme="blue" 
                  size="lg" 
                  onClick={handleContinueToPayment}
                  alignSelf="center"
                  w={{ base: "100%", md: "auto" }}
                >
                  Continue to Payment
                </Button>
              </VStack>
            )}
            
            {paymentStep === 'method' && (
              <VStack spacing={8} align="stretch">
                <Flex justifyContent="space-between" alignItems="center">
                  <Heading size="lg">Payment Method</Heading>
                  <Button 
                    variant="ghost" 
                    leftIcon={<FiCornerUpLeft />}
                    onClick={handleBackToPlan}
                  >
                    Back
                  </Button>
                </Flex>
                
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold">
                      {plan?.name} Plan - {formatCurrency(plan?.price || 0)}/{plan?.interval}
                    </Text>
                    <Text fontSize="sm">
                      You will be charged {formatCurrency(plan?.price || 0)} for your subscription.
                    </Text>
                  </Box>
                </Alert>
                
                {paymentError && (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Payment Failed</AlertTitle>
                      <AlertDescription>{paymentError}</AlertDescription>
                    </Box>
                  </Alert>
                )}
                
                {mockSavedPaymentMethods.length > 0 && (
                  <>
                    <Box>
                      <Text fontWeight="medium" mb={3}>Your Payment Methods</Text>
                      <PaymentMethodSelector 
                        savedMethods={mockSavedPaymentMethods}
                        selectedMethod={selectedPaymentMethod}
                        onSelectMethod={handleSelectPaymentMethod}
                      />
                    </Box>
                    
                    <Divider />
                  </>
                )}
                
                {selectedPaymentMethod === 'new' && (
                  <Box>
                    <Text fontWeight="medium" mb={3}>Enter New Card Details</Text>
                    <CreditCardForm onSubmit={handleCardSubmit} />
                  </Box>
                )}
                
                {selectedPaymentMethod && selectedPaymentMethod !== 'new' && (
                  <Button 
                    colorScheme="blue" 
                    size="lg"
                    isLoading={isProcessing}
                    loadingText="Processing Payment..."
                    onClick={() => handleCardSubmit({} as CardDetails)}
                  >
                    Complete Payment
                  </Button>
                )}
                
                <HStack justify="center" spacing={2} mt={4}>
                  <Box as={FiShield} />
                  <Text fontSize="sm" color="gray.500">
                    Secure payment processing powered by Stripe
                  </Text>
                </HStack>
              </VStack>
            )}
            
            {paymentStep === 'processing' && (
              <VStack spacing={8} py={10} align="center">
                <Spinner size="xl" color="blue.500" thickness="4px" />
                <Text fontSize="lg">Processing your payment...</Text>
                <Text color="gray.500">
                  Please do not close this window while your payment is being processed.
                </Text>
              </VStack>
            )}
          </TabPanel>
          
          {/* History Tab */}
          <TabPanel p={0} pt={6}>
            <Heading size="lg" mb={6}>Payment History</Heading>
            <PaymentHistory payments={paymentHistory} loading={isLoadingHistory} />
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      <SuccessModal 
        isOpen={isSuccessOpen} 
        onClose={() => {
          onSuccessClose();
          // Reset to first step after successful payment
          setPaymentStep('plan');
          // Refresh payment history if on that tab
          if (activeTab === 1) {
            loadPaymentHistory();
          } else {
            // Switch to history tab to show the new payment
            setActiveTab(1);
          }
        }} 
        paymentDetails={successDetails} 
      />
    </Box>
  );
};

export default PaymentProcessor; 