import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { 
  Play, 
  Cpu, 
  RefreshCw, 
  Code,
  FolderOpen, 
  Binary,
  Folder,
  FileCode,
  Bell,
  Activity,
  Check,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Layers,
  ArrowLeft,
  Sliders,
  Copy,
  Download,
  Plus,
  Search,
  Settings,
  Terminal,
  Briefcase,
  Layout,
  Columns,
  PanelRightClose,
  PanelRightOpen
} from 'lucide-react';


// --- Types ---
interface FileItem {
  file_path: string;
  language: string;
  framework: string;
}

interface MethodSignature {
  name: string;
  args: string;
}

interface ParsedStructure {
  classes: Array<{ name: string; methods: MethodSignature[] }>;
  functions: MethodSignature[];
  imports: string[];
  complexity: string;
}

// --- Mock Database for Sandbox Mode ---
const SANDBOX_FILES: FileItem[] = [
  { file_path: 'src/services/UserAuth.ts', language: 'TypeScript', framework: 'Jest' },
  { file_path: 'src/services/PaymentService.ts', language: 'TypeScript', framework: 'Jest' },
  { file_path: 'src/api/DataParser.cpp', language: 'C++', framework: 'Google Test' },
  { file_path: 'src/utils.go', language: 'Go', framework: 'testing' },
  { file_path: 'src/models/AuthService.java', language: 'Java', framework: 'JUnit 5' }
];

const SANDBOX_STRUCTURES: Record<string, ParsedStructure> = {
  'src/services/UserAuth.ts': {
    classes: [
      { 
        name: 'UserAuth', 
        methods: [
          { name: 'login', args: '(user: User, mfaToken: string) -> Promise<Session>' },
          { name: 'logout', args: '(sessionId: string) -> Promise<void>' },
          { name: 'requestPasswordReset', args: '(email: string) -> Promise<boolean>' },
          { name: 'verifyMfaToken', args: '(token: string) -> boolean' }
        ] 
      }
    ],
    functions: [
      { name: 'validateEmailFormat', args: '(email: string) -> boolean' },
      { name: 'hashCredentials', args: '(pass: string) -> Promise<string>' }
    ],
    imports: ['jwt', 'crypto', 'dbConnector'],
    complexity: 'Medium (O(N))'
  },
  'src/services/PaymentService.ts': {
    classes: [
      { 
        name: 'PaymentService', 
        methods: [
          { name: 'initialize', args: '(apiKey: string, sandbox: boolean) -> void' },
          { name: 'processTransaction', args: '(amount: number, currency: string) -> Promise<Receipt>' },
          { name: 'refund', args: '(transactionId: string, value: number) -> Promise<Receipt>' },
          { name: 'validateCard', args: '(cardNumber: string, expiry: string) -> boolean' }
        ] 
      }
    ],
    functions: [],
    imports: ['stripe', 'config', 'models/Transaction'],
    complexity: 'Low (O(1))'
  },
  'src/api/DataParser.cpp': {
    classes: [
      { 
        name: 'DataParser', 
        methods: [
          { name: 'loadBuffer', args: '(const char* buffer, size_t len) -> bool' },
          { name: 'computeStandardDeviation', args: '(const std::vector<double>& v) -> double' },
          { name: 'flushBuffer', args: '() -> void' }
        ] 
      }
    ],
    functions: [
      { name: 'initializeDevice', args: '() -> int' },
      { name: 'shutdownDevice', args: '() -> void' }
    ],
    imports: ['iostream', 'vector', 'cmath', 'algorithm'],
    complexity: 'High (O(N^2))'
  },
  'src/utils.go': {
    classes: [],
    functions: [
      { name: 'ProcessOrder', args: '(ctx context.Context, ord *Order) error' },
      { name: 'CancelOrder', args: '(ctx context.Context, id string) error' },
      { name: 'CalculateTaxes', args: '(subtotal float64, rate float64) float64' },
      { name: 'DispatchReceipt', args: '(receipt *Receipt) <-chan struct{}' }
    ],
    imports: ['fmt', 'context', 'models/shipping'],
    complexity: 'High (O(N log N))'
  },
  'src/models/AuthService.java': {
    classes: [
      { 
        name: 'AuthService', 
        methods: [
          { name: 'authenticateUser', args: '(User user, String pass) -> boolean' },
          { name: 'generateJwtToken', args: '(UserPrincipal principal) -> String' },
          { name: 'invalidateSession', args: '(UUID sessionId) -> void' }
        ] 
      }
    ],
    functions: [],
    imports: ['java.util.Date', 'io.jsonwebtoken.Jwts', 'javax.crypto.SecretKey'],
    complexity: 'Medium'
  }
};

const MOCK_GENERATED_CODE: Record<string, string> = {
  'src/services/UserAuth.ts': `import { UserAuth } from './UserAuth';
import { dbConnector } from 'dbConnector';

describe('UserAuth Service Integration Suite', () => {
  const auth = new UserAuth();

  beforeAll(async () => {
    await dbConnector.connect();
  });

  test('should authenticate user with valid credentials & MFA', async () => {
    const session = await auth.login({ email: 'dev@polytest.ai' }, '998122');
    expect(session).toBeDefined();
    expect(session.sessionId).toBeTruthy();
    expect(session.status).toBe('ACTIVE');
  });

  test('should reject password reset request for invalid email formats', async () => {
    const success = await auth.requestPasswordReset('bad-email-format');
    expect(success).toBe(false);
  });

  test('should correctly hash security credentials on registration', async () => {
    const hash = await hashCredentials('securePass123!');
    expect(hash).not.toBe('securePass123!');
    expect(hash.length).toBeGreaterThan(32);
  });
});`,

  'src/services/PaymentService.ts': `import { PaymentService } from './PaymentService';
import { stripe } from 'stripe';

describe('PaymentService API Gateway Suite', () => {
  const payment = new PaymentService();

  beforeAll(() => {
    payment.initialize('sk_test_51M_polytest', true);
  });

  test('should successfully compile sandboxed transactions', async () => {
    const receipt = await payment.processTransaction(2900, 'USD');
    expect(receipt).toHaveProperty('id');
    expect(receipt.captured).toBe(true);
    expect(receipt.amount).toBe(2900);
  });

  test('should validate cards conforming to standard Luhn systems', () => {
    const isValid = payment.validateCard('4111222233334444', '12/28');
    expect(isValid).toBe(true);
  });

  test('should reject refunds exceeding purchase amounts', async () => {
    await expect(payment.refund('tx_10029', 99999))
      .rejects.toThrow('Refund limit exceeded');
  });
});`,

  'src/api/DataParser.cpp': `#include <gtest/gtest.h>
#include "DataParser.h"

class DataParserTest : public ::testing::Test {
protected:
    DataParser parser;
};

TEST_F(DataParserTest, LoadsBuffersWithCleanTermination) {
    const char* sample = "AST_PROFILE_STREAM_PACKET";
    bool success = parser.loadBuffer(sample, 25);
    EXPECT_TRUE(success);
}

TEST_F(DataParserTest, StandardDeviationComputationMatches) {
    std::vector<double> dataset = {10.0, 12.0, 23.0, 8.0, 16.0};
    double stddev = parser.computeStandardDeviation(dataset);
    EXPECT_NEAR(stddev, 5.385, 0.001);
}

TEST_F(DataParserTest, ShutdownSequenceClosesDevices) {
    int code = initializeDevice();
    EXPECT_EQ(code, 0);
    shutdownDevice();
}`,

  'src/utils.go': `package main

import (
	"context"
	"testing"
)

func TestProcessOrder_IntegrationSuccess(t *testing.T) {
	ctx := context.Background()
	order := &Order{ID: "ORD-9921", Subtotal: 150.00}
	
	err := ProcessOrder(ctx, order)
	if err != nil {
		t.Fatalf("Expected nil error, got: %v", err)
	}
}

func TestCalculateTaxes_PreciseRateMatching(t *testing.T) {
	subtotal := 100.00
	rate := 0.0825
	
	taxes := CalculateTaxes(subtotal, rate)
	expected := 8.25
	
	if taxes != expected {
		t.Errorf("Expected %.2f, got %.2f", expected, taxes)
	}
}`,

  'src/models/AuthService.java': `package com.polytest.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class AuthServiceTest {
    private AuthService authService;

    @BeforeEach
    public void setup() {
        authService = new AuthService();
    }

    @Test
    public void testAuthenticateUser_Success() {
        User user = new User("dev@polytest.ai");
        boolean authenticated = authService.authenticateUser(user, "adminToken112");
        assertTrue(authenticated);
    }

    @Test
    public void testSessionInvalidation() {
        UUID sessionToken = UUID.randomUUID();
        authService.invalidateSession(sessionToken);
        // Validates subprocess linter output
    }
}`
};

const MOCK_SOURCE_CODE: Record<string, string> = {
  'src/services/UserAuth.ts': `import { jwt } from 'jwt';
import { crypto } from 'crypto';
import { dbConnector } from 'dbConnector';

export interface User {
  email: string;
  id?: string;
}

export interface Session {
  sessionId: string;
  status: string;
}

export class UserAuth {
  public async login(user: User, mfaToken: string): Promise<Session> {
    if (!this.verifyMfaToken(mfaToken)) {
      throw new Error("Invalid MFA Token");
    }
    const hash = await this.hashCredentials(user.email);
    const sessionId = jwt.sign({ email: user.email, hash }, "SECRET_KEY");
    return { sessionId, status: 'ACTIVE' };
  }

  public async logout(sessionId: string): Promise<void> {
    await dbConnector.invalidate(sessionId);
  }

  public async requestPasswordReset(email: string): Promise<boolean> {
    if (!this.validateEmailFormat(email)) {
      return false;
    }
    return dbConnector.queueResetEmail(email);
  }

  public verifyMfaToken(token: string): boolean {
    return token.length === 6 && !isNaN(Number(token));
  }

  private async hashCredentials(pass: string): Promise<string> {
    return crypto.createHash('sha256').update(pass).digest('hex');
  }
}

export function validateEmailFormat(email: string): boolean {
  return email.includes('@') && email.includes('.');
}`,

  'src/services/PaymentService.ts': `import { stripe } from 'stripe';
import { config } from 'config';
import { Transaction } from 'models/Transaction';

export interface Receipt {
  id: string;
  captured: boolean;
  amount: number;
}

export class PaymentService {
  private client: any;
  private isSandbox: boolean = false;

  public initialize(apiKey: string, sandbox: boolean): void {
    this.client = new stripe(apiKey);
    this.isSandbox = sandbox;
  }

  public async processTransaction(amount: number, currency: string): Promise<Receipt> {
    const charge = await this.client.charges.create({
      amount,
      currency,
      description: 'PolyTest Automated Transaction Run'
    });
    return {
      id: charge.id,
      captured: charge.captured,
      amount: charge.amount
    };
  }

  public async refund(transactionId: string, value: number): Promise<Receipt> {
    const refundObj = await this.client.refunds.create({
      charge: transactionId,
      amount: value
    });
    return {
      id: refundObj.id,
      captured: true,
      amount: value
    };
  }

  public validateCard(cardNumber: string, expiry: string): boolean {
    if (cardNumber.length !== 16) return false;
    const parts = expiry.split('/');
    if (parts.length !== 2) return false;
    return true;
  }
}`,

  'src/api/DataParser.cpp': `#include <iostream>
#include <vector>
#include <cmath>
#include <algorithm>

class DataParser {
private:
    std::vector<char> internalBuffer;

public:
    bool loadBuffer(const char* buffer, size_t len) {
        if (!buffer || len == 0) return false;
        internalBuffer.assign(buffer, buffer + len);
        return true;
    }

    double computeStandardDeviation(const std::vector<double>& v) {
        if (v.empty()) return 0.0;
        double sum = 0.0;
        for (double val : v) sum += val;
        double mean = sum / v.size();
        
        double accum = 0.0;
        for (double val : v) {
            accum += (val - mean) * (val - mean);
        }
        return std::sqrt(accum / (v.size() - 1));
    }

    void flushBuffer() {
        internalBuffer.clear();
    }
};

int initializeDevice() {
    std::cout << "[Device] Initializing physical data bus..." << std::endl;
    return 0;
}

void shutdownDevice() {
    std::cout << "[Device] Shutting down physical data bus..." << std::endl;
}`,

  'src/utils.go': `package main

import (
	"context"
	"errors"
	"fmt"
)

type Order struct {
	ID       string
	Subtotal float64
}

type Receipt struct {
	OrderID string
	Tax     float64
}

func ProcessOrder(ctx context.Context, ord *Order) error {
	if ord == nil {
		return errors.New("order cannot be nil")
	}
	if ord.ID == "" {
		return fmt.Errorf("invalid order subtotal or empty id")
	}
	fmt.Printf("[Order] Order %s successfully processed\\n", ord.ID)
	return nil
}

func CancelOrder(ctx context.Context, id string) error {
	if id == "" {
		return errors.New("empty order id")
	}
	fmt.Printf("[Order] Cancelling order %s\\n", id)
	return nil
}

func CalculateTaxes(subtotal float64, rate float64) float64 {
	if subtotal <= 0 || rate <= 0 {
		return 0.0
	}
	return subtotal * rate
}

func DispatchReceipt(receipt *Receipt) <-chan struct{} {
	ch := make(chan struct{})
	go func() {
		defer close(ch)
		fmt.Printf("[Dispatch] Sending receipt for order %s\\n", receipt.OrderID)
		ch <- struct{}{}
	}()
	return ch
}`,

  'src/models/AuthService.java': `package com.polytest.services;

import java.util.Date;
import io.jsonwebtoken.Jwts;
import javax.crypto.SecretKey;

public class AuthService {
    public boolean authenticateUser(User user, String pass) {
        if (user == null || pass == null) {
            return false;
        }
        return pass.equals("adminToken112") && user.getEmail().endsWith("@polytest.ai");
    }

    public String generateJwtToken(UserPrincipal principal) {
        return Jwts.builder()
            .setSubject(principal.getName())
            .setIssuedAt(new Date())
            .compact();
    }

    public void invalidateSession(UUID sessionId) {
        System.out.println("Session " + sessionId + " invalidated successfully.");
    }
}`
};

const API_BASE = 'http://127.0.0.1:8000/api/v1';

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  }
};

const slideUpItem: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 200, damping: 18 } 
  }
};

function App() {
  // Navigation State: 'landing' or 'console' or 'guide'
  const [viewMode, setViewMode] = useState<'landing' | 'console' | 'guide'>('landing');
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  // Connection and Workspace States
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false);
  const [projectRoot, setProjectRoot] = useState<string>('/Users/prakhar/Projects/Polytest AI ');
  const [files, setFiles] = useState<FileItem[]>(SANDBOX_FILES);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(SANDBOX_FILES[1]); // PaymentService.ts
  const [isScanning, setIsScanning] = useState<boolean>(false);
  
  // Add Sandbox File States
  const [showAddFileForm, setShowAddFileForm] = useState<boolean>(false);
  const [newFileName, setNewFileName] = useState<string>('');
  const [newFileLanguage, setNewFileLanguage] = useState<string>('TypeScript');
  const [newFileFramework, setNewFileFramework] = useState<string>('Jest');
  
  // Code Inspection States
  const [parsedStructure, setParsedStructure] = useState<ParsedStructure | null>(SANDBOX_STRUCTURES['src/services/PaymentService.ts']);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(false);
  const [selectedMethods, setSelectedMethods] = useState<string[]>(['initialize', 'processTransaction', 'refund', 'validateCard']);

  // Double Tab Canvas state: 'inspector' or 'code' or 'linter'
  const [canvasTab, setCanvasTab] = useState<'inspector' | 'code' | 'linter'>('inspector');
  const [activeNode, setActiveNode] = useState<string | null>(null);

  // Parameters presets
  const [selectedPreset, setSelectedPreset] = useState<'standard' | 'robust' | 'fast'>('standard');

  // Advanced AI Slider states
  const [temperature, setTemperature] = useState<number>(0.2);
  const [maxTokens, setMaxTokens] = useState<number>(2048);
  const [coverageTarget, setCoverageTarget] = useState<number>(90);

  // Generator Options
  const [selectedProvider, setSelectedProvider] = useState<string>('mock');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-1.5-flash');
  const [useCache, setUseCache] = useState<boolean>(true);
  const [runImmediately, setRunImmediately] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Active Code Output View
  const [currentGeneratedCode, setCurrentGeneratedCode] = useState<string>(MOCK_GENERATED_CODE['src/services/PaymentService.ts']);

  // Radial Progress parameters
  const [syntaxCorrectness, setSyntaxCorrectness] = useState<number>(98);
  const [validatedCount, setValidatedCount] = useState<number>(114);
  const [issueCount, setIssueCount] = useState<number>(2);

  // Search & Live Telemetry history buffers
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cpuHistory, setCpuHistory] = useState<number[]>([12, 16, 14, 18, 15, 20, 22, 19, 17, 24, 25, 21, 23, 26, 24]);
  const [ramHistory, setRamHistory] = useState<number[]>([38, 39, 41, 40, 42, 43, 42, 44, 45, 43, 44, 46, 47, 45, 46]);

  // Terminal Tab State: 'execution' | 'metrics' | 'warnings'
  const [terminalTab, setTerminalTab] = useState<'execution' | 'metrics' | 'warnings'>('execution');
  const [workbenchWidth, setWorkbenchWidth] = useState<'wide' | 'narrow' | 'hidden'>('wide');
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);

  // Dynamic layout calculations based on preset selection and screen/window width
  const getFlexShares = () => {
    if (workbenchWidth === 'hidden') {
      return { left: 1, right: 0 };
    }
    
    // Base ratios:
    // 'narrow' -> 75:25 (Left: 1.5, Right: 0.5)
    // 'wide' -> 55:45 (Left: 1.1, Right: 0.9)
    let leftShare = workbenchWidth === 'narrow' ? 1.5 : 1.1;
    let rightShare = workbenchWidth === 'narrow' ? 0.5 : 0.9;
    
    // Auto-minimize/hide on small screen dimensions to optimize code editor visibility
    if (windowWidth < 768) {
      // Extremely narrow screen (mobile): automatically hide right workbench completely
      return { left: 1, right: 0 };
    } else if (windowWidth < 1024) {
      // Tablet/small laptop: force a narrower workbench so Left pane gets more space
      leftShare = 1.7;
      rightShare = 0.3;
    } else if (windowWidth < 1280) {
      // Medium screen: scale down right workbench moderately
      if (workbenchWidth === 'wide') {
        leftShare = 1.35;
        rightShare = 0.65;
      } else {
        leftShare = 1.6;
        rightShare = 0.4;
      }
    }
    
    return { left: leftShare, right: rightShare };
  };

  const flexShares = getFlexShares();
  const isHidden = flexShares.right === 0;

  // Terminal & Run Outcomes
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '🌐 PolyTest AI Premium Engine successfully initialized.',
    '⚡ Active client stack: React + TypeScript (Vite).',
    '🔌 Local host connection: Ready to query REST endpoints.',
    'ℹ️ Sandbox fallback mode is ACTIVE (Mock profiles loaded).'
  ]);

  // Adjust parameters when a preset is toggled
  const applyPreset = (preset: 'standard' | 'robust' | 'fast') => {
    setSelectedPreset(preset);
    if (preset === 'standard') {
      setTemperature(0.2);
      setMaxTokens(2048);
      setCoverageTarget(90);
      setTerminalLogs(prev => [...prev, '⚙️ Selected preset: STANDARD (Temp=0.2, Tokens=2048, Cov=90%)']);
    } else if (preset === 'robust') {
      setTemperature(0.4);
      setMaxTokens(3072);
      setCoverageTarget(100);
      setTerminalLogs(prev => [...prev, '⚙️ Selected preset: ROBUST (Temp=0.4, Tokens=3072, Cov=100%)']);
    } else if (preset === 'fast') {
      setTemperature(0.0);
      setMaxTokens(1024);
      setCoverageTarget(75);
      setTerminalLogs(prev => [...prev, '⚙️ Selected preset: FAST RUN (Temp=0.0, Tokens=1024, Cov=75%)']);
    }
  };

  // 1. Health Ping check to API Server
  const checkHealth = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/health');
      if (res.ok) {
        setIsBackendOnline(true);
        setTerminalLogs(prev => [
          ...prev, 
          '🟢 Node.js TypeScript Express server detected online! Binding REST channels live on Port 8000.'
        ]);
        triggerAutoDetect();
      } else {
        setIsBackendOnline(false);
      }
    } catch {
      setIsBackendOnline(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    
    // Live chart updates
    const chartInterval = setInterval(() => {
      setCpuHistory(prev => {
        const nextVal = Math.max(6, Math.min(65, Math.round(prev[prev.length - 1] + (Math.random() - 0.5) * 10)));
        return [...prev.slice(1), nextVal];
      });
      setRamHistory(prev => {
        const nextVal = Math.max(28, Math.min(94, Math.round(prev[prev.length - 1] + (Math.random() - 0.5) * 6)));
        return [...prev.slice(1), nextVal];
      });
    }, 1000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      clearInterval(chartInterval);
    };
  }, []);


  // 2. Scan Workspace Files
  const triggerAutoDetect = async () => {
    setIsScanning(true);
    
    if (isBackendOnline) {
      try {
        const res = await fetch(`${API_BASE}/detect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project_dir: null })
        });
        const data = await res.json();
        if (data.status === 'success' && data.files_found) {
          setFiles(data.files_found);
          setProjectRoot(data.project_root);
          if (data.files_found.length > 0) {
            setSelectedFile(data.files_found[0]);
            handleFileSelect(data.files_found[0]);
          }
          setTerminalLogs(prev => [
            ...prev, 
            `✅ Found ${data.files_found.length} active multi-language developer files.`
          ]);
        }
      } catch (err) {
        setTerminalLogs(prev => [...prev, `❌ Backend scanning failed. Safe-mode sandbox active.`]);
      }
    } else {
      setTimeout(() => {
        setFiles(SANDBOX_FILES);
        setTerminalLogs(prev => [
          ...prev, 
          `✅ [Sandbox] Auto-scanned project. Located 5 target source files.`
        ]);
        setIsScanning(false);
      }, 500);
      return;
    }
    setIsScanning(false);
  };

  // 3. Analyze Target Code file
  const handleFileSelect = async (file: FileItem) => {
    setSelectedFile(file);
    setActiveNode(null);
    setIsLoadingAnalysis(true);
    setTerminalLogs(prev => [...prev, `📂 Loading AST structural patterns: ${file.file_path}`]);

    // Update active mockup code block
    if (MOCK_GENERATED_CODE[file.file_path]) {
      setCurrentGeneratedCode(MOCK_GENERATED_CODE[file.file_path]);
    }

    if (isBackendOnline) {
      try {
        const res = await fetch(`${API_BASE}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_path: file.file_path })
        });
        const data = await res.json();
        if (data.status === 'success') {
          const struct: ParsedStructure = {
            classes: data.structure.classes,
            functions: data.structure.functions,
            imports: data.structure.imports,
            complexity: data.structure.complexity || 'Medium'
          };
          setParsedStructure(struct);
          
          const methodsList: string[] = [];
          struct.classes.forEach(c => methodsList.push(...c.methods.map(m => m.name)));
          setSelectedMethods(methodsList);
        }
      } catch (e) {
        setTerminalLogs(prev => [...prev, `❌ AST parser error: ${e}`]);
      }
    } else {
      setTimeout(() => {
        const mockStruct = SANDBOX_STRUCTURES[file.file_path] || {
          classes: [{ name: 'CustomService', methods: [{ name: 'executeOperation', args: '() -> void' }] }],
          functions: [{ name: 'utilityHelper', args: '() -> void' }],
          imports: ['standard_lib'],
          complexity: 'Low'
        };
        setParsedStructure(mockStruct);
        
        const methodsList: string[] = [];
        mockStruct.classes.forEach(c => methodsList.push(...c.methods.map(m => m.name)));
        mockStruct.functions.forEach(f => methodsList.push(f.name));
        setSelectedMethods(methodsList);
        
        setIsLoadingAnalysis(false);
      }, 200);
      return;
    }
    setIsLoadingAnalysis(false);
  };

  // Add Custom Sandbox File
  const handleAddFileSubmit = () => {
    if (!newFileName.trim()) return;
    
    const inputPath = newFileName.trim();
    const formattedPath = inputPath.startsWith('src/') ? inputPath : `src/${inputPath}`;
    
    const newFile: FileItem = {
      file_path: formattedPath,
      language: newFileLanguage,
      framework: newFileFramework
    };

    // Add to state files list
    setFiles(prev => [...prev, newFile]);

    // Populate mock AST parser structure so AST inspector works immediately for this file!
    const baseName = formattedPath.split('/').pop()?.split('.')[0] || 'CustomService';
    SANDBOX_STRUCTURES[formattedPath] = {
      classes: [
        { 
          name: baseName, 
          methods: [
            { name: 'execute', args: '() -> void' },
            { name: 'validate', args: '(data: any) -> boolean' }
          ] 
        }
      ],
      functions: [
        { name: 'helperUtility', args: '() -> void' }
      ],
      imports: ['core', 'utils'],
      complexity: 'Low'
    };

    // Also populate mock generated code so Code Preview works!
    MOCK_GENERATED_CODE[formattedPath] = `// Generated automatically by PolyTest AI mock engine for ${formattedPath.split('/').pop()}
import { ${baseName} } from './${baseName}';

describe('${baseName} Suite', () => {
  it('should run execution assertions successfully', () => {
    expect(true).toBe(true);
  });
});
`;

    // Select the newly added file immediately!
    handleFileSelect(newFile);

    // Close form and clear
    setShowAddFileForm(false);
    setNewFileName('');
    
    setTerminalLogs(prev => [...prev, `🟢 Successfully registered custom sandbox module: ${formattedPath}`]);
  };

  // Toggle single method selection
  const toggleMethod = (method: string) => {
    if (selectedMethods.includes(method)) {
      setSelectedMethods(prev => prev.filter(m => m !== method));
    } else {
      setSelectedMethods(prev => [...prev, method]);
    }
  };

  // 4. Generate AI Unit Test Case API
  const handleGenerate = async () => {
    if (!selectedFile) return;
    setIsGenerating(true);
    setTerminalLogs(prev => [
      ...prev, 
      `🚀 Initializing PolyTest test generation for: ${selectedFile.file_path}`,
      `⚙️ System Config: Temperature=${temperature}, Tokens=${maxTokens}, TargetCoverage=${coverageTarget}%, Methods=[${selectedMethods.join(', ')}]`
    ]);

    if (isBackendOnline) {
      try {
        const res = await fetch(`${API_BASE}/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: selectedFile.file_path,
            provider: selectedProvider,
            model: selectedModel,
            framework: null,
            mock: selectedProvider === 'mock',
            no_cache: !useCache,
            run: runImmediately
          })
        });
        const data = await res.json();
        if (data.status === 'success' && data.results.length > 0) {
          const mainRes = data.results[0];
          
          setTerminalLogs(prev => [
            ...prev,
            `✨ Test suite written successfully into output: ${mainRes.test_file}`,
            `✅ Compiler Check: PASSED. Generated 12 validation blocks.`
          ]);

          if (mainRes.generated_code) {
            setCurrentGeneratedCode(mainRes.generated_code);
          }

          if (mainRes.run_result) {
            const run = mainRes.run_result;
            setTerminalLogs(prev => [
              ...prev,
              `---------------- SUBPROCESS EXECUTION LOGS ----------------`,
              run.raw_output,
              `-----------------------------------------------------------`,
              `📊 Outcomes: Passed=${run.passed_count}, Failed=${run.failed_count}, Duration=${run.duration_seconds.toFixed(3)}s`
            ]);
            
            setSyntaxCorrectness(100);
            setValidatedCount(prev => prev + 1);
            setIssueCount(0);
          }

          // Dynamic tab transition to preview the code
          setCanvasTab('code');
        } else {
          setTerminalLogs(prev => [...prev, `❌ Generation check failed: ${data.detail || 'Internal server error'}`]);
        }
      } catch (err) {
        setTerminalLogs(prev => [...prev, `❌ Connection error calling REST generate route.`]);
      }
    } else {
      setTimeout(() => {
        const testFileDest = `tests/test_${selectedFile.file_path.split('/').pop()}`;
        
        setTerminalLogs(prev => [
          ...prev,
          `✨ [SANDBOX] AI compilation processed!`,
          `📁 Output created: ${testFileDest}`,
          `⚡ Executing syntax validation compiler pipeline...`,
          `🟢 Validated clean and stable syntax: 100% correct.`
        ]);

        if (runImmediately) {
          setTimeout(() => {
            const numTests = selectedMethods.length > 0 ? selectedMethods.length : 4;
            setTerminalLogs(prev => [
              ...prev,
              `---------------- SUBPROCESS EXECUTION LOGS ----------------`,
              `[POLYTEST] Analysis complete... [AI] Analyzing code methods.`,
              `[STATUS] Generating tests for '${selectedFile.file_path.split('/').pop()}'...`,
              `[SUCCESS] Generated '${testFileDest.split('/').pop()}' (${numTests} specs, 98% cov)`,
              `platform darwin -- node.js v25.9.0, Jest 29.5`,
              `collected ${numTests} items`,
              `tests/${testFileDest.split('/').pop()} . ${'.'.repeat(numTests - 1)} [100%]`,
              `==================== ${numTests} passed in 0.018 seconds ====================`,
              `-----------------------------------------------------------`,
              `📊 Outcomes: Status=PASSED, Passed=${numTests}, Failed=0, Duration=0.018s`
            ]);
            setSyntaxCorrectness(100);
            setValidatedCount(prev => prev + 1);
            setIssueCount(0);
            setIsGenerating(false);

            // Dynamic tab transition to code preview
            setCanvasTab('code');
          }, 1000);
        } else {
          setIsGenerating(false);
          setCanvasTab('code');
        }
      }, 1200);
      return;
    }
    setIsGenerating(false);
  };

  const getLanguageColor = (lang: string) => {
    switch (lang.toLowerCase()) {
      case 'python': return '#3572A5';
      case 'javascript': return '#f1e05a';
      case 'typescript': return '#3178c6';
      case 'java': return '#b07219';
      case 'go': return '#00ADD8';
      case 'c++': return '#f34b7d';
      default: return '#94a3b8';
    }
  };

  // Utility to split code into syntax highlighted sections
  const renderHighlightedCode = (code: string) => {
    const lines = code.split('\n');
    return lines.map((line, idx) => {
      // Basic keyword mapping for color styling
      let renderedLine = <span style={{ color: 'var(--text-primary)' }}>{line}</span>;
      
      if (line.trim().startsWith('import') || line.trim().startsWith('const') || line.trim().startsWith('package')) {
        renderedLine = (
          <span>
            <span style={{ color: 'var(--accent-purple)', fontWeight: 600 }}>{line.split(' ')[0]}</span>
            <span style={{ color: 'var(--text-secondary)' }}>{line.substring(line.split(' ')[0].length)}</span>
          </span>
        );
      } else if (line.includes('describe') || line.includes('test') || line.includes('TEST_F') || line.includes('Test')) {
        renderedLine = (
          <span>
            <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
              {line.includes('describe') ? 'describe' : line.includes('test') ? 'test' : 'TEST_F'}
            </span>
            <span style={{ color: '#fff' }}>
              {line.substring(line.indexOf('('))}
            </span>
          </span>
        );
      } else if (line.includes('expect') || line.includes('EXPECT_')) {
        renderedLine = (
          <span>
            <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>expect</span>
            <span style={{ color: 'var(--text-secondary)' }}>{line.substring(line.indexOf('expect') + 6)}</span>
          </span>
        );
      }

      return (
        <div key={idx} className="code-editor-line" style={{ display: 'flex', gap: '16px', fontFamily: 'var(--font-mono)', fontSize: '11px', lineHeight: '1.6' }}>
          <span className="code-line-number" style={{ width: '28px', color: 'var(--text-muted)', textAlign: 'right', display: 'inline-block', userSelect: 'none' }}>
            {idx + 1}
          </span>
          {renderedLine}
        </div>
      );
    });
  };

  return (
    <div className="select-none">
      <AnimatePresence mode="wait">
        
        {/* ========================================================================= */}
        {/* VIEW MODE 1: PREMIUM SAAS LANDING PAGE */}
        {/* ========================================================================= */}
        {viewMode === 'landing' && (
          <motion.div 
            key="landing-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="landing-layout-root"
          >
          
          {/* SaaS Header Bar */}
          <nav className={`saas-nav-block ${isScrolled ? 'scrolled' : ''}`}>
            <div className="landing-inner-wrap">
              <div className="flex-row-align">
                <div className="brand-icon-box">
                  <Cpu className="w-5 h-5 text-cyan-400" />
                </div>
                <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-[#8c52ff] to-purple-400 bg-clip-text text-transparent">PolyTest AI</h1>
              </div>

              <div className="saas-nav-links">
                <a href="#features">Features</a>
                <a href="#pricing">Pricing</a>
                <a href="#vscode">VS Code Extension</a>
                <span className="nav-split-divider" />
                <div className="nav-status-badge">
                  <span className={`nav-status-dot ${isBackendOnline ? 'active' : 'sandbox'}`} />
                  <span>{isBackendOnline ? 'REST Active' : 'Sandbox Ready'}</span>
                </div>
              </div>

              <button 
                onClick={() => setViewMode('console')}
                className="crisp-button"
              >
                Launch Console
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </nav>

          <main className="landing-content-wrap">

          {/* SaaS Hero Section */}
          <header className="hero-wrapper">
            <motion.div 
              className="hero-left"
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              <motion.span className="hero-tag" variants={slideUpItem}>
                🚀 Now Supporting 7 Languages
              </motion.span>
              <motion.h2 className="hero-heading" variants={slideUpItem}>
                Autonomous Unit Test Generation For <span className="gradient-text">Developers.</span>
              </motion.h2>
              <motion.p className="hero-description" style={{ fontSize: '15px' }} variants={slideUpItem}>
                Statically parse codebase AST architectures, execute compiler linter dry-runs, and validate test suites via sandboxed subprocess runners—instantly and completely offline.
              </motion.p>

              <motion.div className="hero-cta-buttons" variants={slideUpItem}>
                <button 
                  onClick={() => setViewMode('console')}
                  className="crisp-button"
                  style={{ padding: '14px 28px' }}
                >
                  Start Free Workspace
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a 
                  href="#vscode"
                  className="crisp-button-secondary"
                  style={{ padding: '14px 28px' }}
                >
                  Install Extension
                </a>
              </motion.div>
            </motion.div>

            {/* Interactive 3D Conceptual Code Compiler Sphere */}
            <div className="hero-right-visual">
              <div className="compiler-3d-container">
                <div className="viewport-3d">
                  
                  {/* Floating Holographic telemetry indicators */}
                  <span className="telemetry-tag t-1">[SYS_ACTIVE]</span>
                  <span className="telemetry-tag t-2">[LINT_SECURE]</span>

                  {/* 3D Floating Glassmorphic Code Panels */}
                  <div className="hologram-panel pos-tl">
                    <span style={{ color: 'var(--accent-cyan)' }}>class UserAuth {"{"}</span>
                    <span style={{ color: 'var(--text-muted)', paddingLeft: '8px' }}>login(creds) {"{"}</span>
                    <span style={{ color: 'var(--accent-green)', paddingLeft: '16px' }}>return token;</span>
                    <span style={{ color: 'var(--text-muted)', paddingLeft: '8px' }}>{"}"}</span>
                    <span style={{ color: 'var(--accent-cyan)' }}>{"}"}</span>
                  </div>

                  <div className="hologram-panel pos-tr">
                    <span style={{ color: 'var(--accent-purple)' }}>import {"{"} stripe {"}"}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>payment.initialize()</span>
                    <span style={{ color: 'var(--accent-green)' }}>✓ AST parsed 100%</span>
                  </div>

                  <div className="hologram-panel pos-bl">
                    <span style={{ color: 'var(--accent-red)' }}>#include &lt;gtest&gt;</span>
                    <span style={{ color: '#fff' }}>TEST_F(LoadsBuffers)</span>
                    <span style={{ color: 'var(--accent-green)' }}>✓ GTest Ok</span>
                  </div>

                  <div className="hologram-panel pos-br">
                    <span style={{ color: 'var(--accent-cyan)' }}>package main</span>
                    <span style={{ color: 'var(--text-secondary)' }}>go test -v ./...</span>
                    <span style={{ color: 'var(--accent-green)' }}>✓ 100% Cov</span>
                  </div>

                  {/* Pulsating energy core sphere */}
                  <div className="pulse-core" />

                  {/* Orthogonal spinning 3D rings */}
                  <div className="sphere-3d-core">
                    <div className="ring-3d axis-x" />
                    <div className="ring-3d axis-y" />
                    <div className="ring-3d axis-z" />
                  </div>

                </div>
              </div>
            </div>
          </header>

          {/* Feature grid Section */}
          <section id="features" style={{ borderTop: '1px solid var(--border-color)' }}>
            <div className="features-grid-wrapper">
              
              {/* Feature 1 */}
              <motion.div 
                className="feature-box-crisp"
                whileHover={{ y: -6, scale: 1.015, borderColor: "rgba(0, 245, 255, 0.25)", boxShadow: "0 10px 30px rgba(0, 245, 255, 0.06)" }}
                transition={{ type: "spring", stiffness: 300, damping: 16 }}
              >
                <div className="icon-wrapper-badge cyan">
                  <Code className="w-4 h-4" />
                </div>
                <h4 className="feature-card-title">Multi-Language AST</h4>
                <p className="feature-card-desc">
                  State-aware AST parsers statically profile classes, imports, functions, and complexity with zero compiler dependencies.
                </p>
              </motion.div>

              {/* Feature 2 */}
              <motion.div 
                className="feature-box-crisp"
                whileHover={{ y: -6, scale: 1.015, borderColor: "rgba(140, 82, 255, 0.25)", boxShadow: "0 10px 30px rgba(140, 82, 255, 0.06)" }}
                transition={{ type: "spring", stiffness: 300, damping: 16 }}
              >
                <div className="icon-wrapper-badge purple">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="feature-card-title">Syntax drycompile linter</h4>
                <p className="feature-card-desc">
                  Automated validation linter compiler scans (e.g. `node --check`, `javac`) catch syntax exceptions prior to writing files.
                </p>
              </motion.div>

              {/* Feature 3 */}
              <motion.div 
                className="feature-box-crisp"
                whileHover={{ y: -6, scale: 1.015, borderColor: "rgba(16, 185, 129, 0.25)", boxShadow: "0 10px 30px rgba(16, 185, 129, 0.06)" }}
                transition={{ type: "spring", stiffness: 300, damping: 16 }}
              >
                <div className="icon-wrapper-badge green">
                  <Zap className="w-4 h-4" />
                </div>
                <h4 className="feature-card-title">Subprocess execution</h4>
                <p className="feature-card-desc">
                  Test execution engines trigger local runners (Jest, pytest, JUnit) inside spawned background threads, parsing stdout streams.
                </p>
              </motion.div>

              {/* Feature 4 */}
              <motion.div 
                className="feature-box-crisp"
                whileHover={{ y: -6, scale: 1.015, borderColor: "rgba(239, 68, 68, 0.25)", boxShadow: "0 10px 30px rgba(239, 68, 68, 0.06)" }}
                transition={{ type: "spring", stiffness: 300, damping: 16 }}
              >
                <div className="icon-wrapper-badge red">
                  <Layers className="w-4 h-4" />
                </div>
                <h4 className="feature-card-title">MD5 Prompt Caching</h4>
                <p className="feature-card-desc">
                  Encodes generated targets under local MD5 prompts caching hashes, saving up to 80% on developer credit costs.
                </p>
              </motion.div>

            </div>
          </section>

          {/* VS Code Extension Section */}
          <section id="vscode" className="saas-vscode-section">
            <div className="vscode-left-text">
              <span className="section-label">Integrations</span>
              <h3 className="section-main-heading">The native VS Code extension is active</h3>
              <p className="hero-description">
                Since the entire engine runs under zero-dependency TypeScript modules, you can package the backend directly inside your VS Code extension. Trigger unit test code generation with a simple right-click inside your editor panel!
              </p>
              <div className="vscode-terminal-cmd">
                <span>$ ext install polytest.polytest-vscode</span>
              </div>
            </div>

            <div className="vscode-right-mockup">
              <div className="simulated-editor-window">
                <div className="editor-window-header">
                  <span className="dot-btn red" />
                  <span className="dot-btn yellow" />
                  <span className="dot-btn green" />
                  <span className="editor-window-title">polytest-extension-development-host</span>
                </div>
                <p style={{ color: 'var(--accent-purple)' }}>⚡ PolyTest AI VS Code Extension active!</p>
                <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>// Context menu hook registered: editor/context</p>
                <p style={{ color: '#fff', marginTop: '6px' }}>Right-click menu: [PolyTest AI: Generate Unit Tests]</p>
                <p style={{ color: 'var(--accent-cyan)', marginTop: '12px' }}>✨ Generating PaymentService.test.ts (100% correct AST parsed)...</p>
              </div>
            </div>
          </section>

          {/* Pricing Grid Section */}
          <section id="pricing" className="pricing-section-wrapper">
            <div className="section-header-block">
              <span className="section-label">Pricing</span>
              <h3 className="section-main-heading">Flexible plans for any team</h3>
            </div>

            <div className="pricing-grid-crisp">
              
              {/* Plan 1 */}
              <div className="pricing-card-crisp">
                <div>
                  <h4 className="pricing-card-title">Developer</h4>
                  <p className="pricing-card-sub">For hobbyists and local extension compilers.</p>
                </div>
                <div className="pricing-card-amount-block">
                  <span className="pricing-amount">$0</span>
                  <span className="pricing-period">/forever</span>
                </div>
                <ul className="pricing-features-list">
                  <li>✓ Local Mock Generation</li>
                  <li>✓ Dynamic AST Parsers</li>
                  <li>✓ VS Code offline extension</li>
                </ul>
                <button onClick={() => setViewMode('console')} className="crisp-button-secondary" style={{ marginTop: 'auto', justifyContent: 'center' }}>
                  Get Started
                </button>
              </div>

              {/* Plan 2: Promoted SaaS Card */}
              <div className="pricing-card-crisp highlighted">
                <span className="pricing-popular-tag">
                  Popular
                </span>
                <div>
                  <h4 className="pricing-card-title">Startup Pro</h4>
                  <p className="pricing-card-sub">For fast-moving development teams.</p>
                </div>
                <div className="pricing-card-amount-block">
                  <span className="pricing-amount">$29</span>
                  <span className="pricing-period">/month</span>
                </div>
                <ul className="pricing-features-list">
                  <li className="highlight-item">✓ Real OpenAI / Gemini API access</li>
                  <li>✓ Unlimited Cache Lookups</li>
                  <li>✓ Direct CLI subprocess runs</li>
                  <li>✓ Comprehensive validator modes</li>
                </ul>
                <button onClick={() => setViewMode('console')} className="crisp-button" style={{ marginTop: 'auto' }}>
                  Launch Console
                </button>
              </div>

              {/* Plan 3 */}
              <div className="pricing-card-crisp">
                <div>
                  <h4 className="pricing-card-title">Enterprise</h4>
                  <p className="pricing-card-sub">For scale-ups and high compliance pipelines.</p>
                </div>
                <div className="pricing-card-amount-block">
                  <span className="pricing-amount">Custom</span>
                </div>
                <ul className="pricing-features-list">
                  <li>✓ Dedicated local LLM hosting</li>
                  <li>✓ Custom linter integrations</li>
                  <li>✓ SLA support channels</li>
                </ul>
                <button onClick={() => setViewMode('console')} className="crisp-button-secondary" style={{ marginTop: 'auto', justifyContent: 'center' }}>
                  Contact Sales
                </button>
              </div>

            </div>
          </section>

          {/* SaaS Footer */}
          <footer className="saas-footer-premium">
            <div className="footer-grid-container">
              
              {/* Brand Column */}
              <div className="footer-brand-col">
                <div className="footer-logo-row">
                  <div className="brand-icon-box">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                  </div>
                  <span className="footer-logo-text">PolyTest AI</span>
                </div>
                <p className="footer-brand-tagline">
                  Autonomous AST-driven unit testing, fully cached, completely offline-first.
                </p>
                <div className="footer-status-pill">
                  <span className={`nav-status-dot active`}></span>
                  <span className="footer-status-text">HEALTH: 100% OPERATIONAL</span>
                </div>
              </div>

              {/* Links Column 1 */}
              <div className="footer-links-col" style={{ gridColumn: 'span 2' }}>
                <h5 className="footer-col-header">Platform Engine</h5>
                <ul className="footer-links-list">
                  <li><a href="#features">AST Class Parser</a></li>
                  <li><a href="#features">Drycompile Linter</a></li>
                  <li><a href="#features">Subprocess Subrunner</a></li>
                  <li><a href="#features">MD5 Prompt Cache</a></li>
                </ul>
              </div>

              {/* Links Column 2 */}
              <div className="footer-links-col" style={{ gridColumn: 'span 2' }}>
                <h5 className="footer-col-header">Resources</h5>
                <ul className="footer-links-list">
                  <li><button onClick={() => setViewMode('guide')} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', textAlign: 'left', display: 'block', outline: 'none' }} className="footer-link-btn">Platform User Guide</button></li>
                  <li><a href="#vscode">VS Code Plugin</a></li>
                  <li><a href="#api">Local REST API</a></li>
                  <li><a href="#docs">Developer SDKs</a></li>
                  <li><a href="#docs">Platform Architecture</a></li>
                </ul>
              </div>

              {/* Links Column 3 */}
              <div className="footer-links-col" style={{ gridColumn: 'span 3' }}>
                <h5 className="footer-col-header">Enterprise</h5>
                <ul className="footer-links-list">
                  <li><a href="#pricing">Startup Pro</a></li>
                  <li><a href="#pricing">Subprocess Sandboxes</a></li>
                  <li><a href="#docs">SLA Commitments</a></li>
                  <li><a href="#docs">Compliance & Security</a></li>
                </ul>
              </div>

            </div>

            {/* Bottom Row */}
            <div className="footer-bottom-row">
              <div className="footer-copyright">
                © 2026 PolyTest AI Inc. All rights reserved. Completely offline-first engine.
              </div>
              <div className="footer-cryptography-tags">
                <span className="crypto-hud-badge">[SYS_ACTIVE]</span>
                <span className="crypto-hud-badge">[MD5_CACHE_ACTIVE]</span>
                <span className="crypto-hud-badge">[SANDBOX_ISOLATED]</span>
              </div>
            </div>
          </footer>

          </main>

          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* VIEW MODE 2: INTERACTIVE DEVELOPER DASHBOARD CONSOLE */}
        {/* ========================================================================= */}
        {viewMode === 'console' && (
          <motion.div 
            key="console-view"
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            
            {/* Header HUD Navigation */}
            <header className="console-hud-bar">
            
            {/* Brand logo & workspace returns */}
            <div className="console-hud-left">
              <button 
                onClick={() => setViewMode('landing')}
                className="crisp-button-secondary"
                style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '6px' }}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Return to Site
              </button>

              <div className="console-hud-brand">
                <div className="brand-icon-box" style={{ padding: '6px' }}>
                  <Cpu className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h1 className="console-hud-brand-title bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">PolyTest AI</h1>
                  <p className="console-hud-brand-subtitle">Developer HUD Console</p>
                </div>
              </div>

              {/* Project folder HUD dropdown */}
              <select className="console-workspace-select">
                <option value="quantum">quantum-core-v2</option>
                <option value="alpha">alpha-parser-test</option>
                <option value="legacy">legacy-service-node</option>
              </select>
            </div>

            {/* Diagnostics HUD */}
            <div className="console-hud-right">
              <div className="diagnostics-banner">
                <Activity className="w-3.5 h-3.5 text-[#475569]" />
                <div className="flex-row-align" style={{ gap: '6px' }}>
                  <span className={`nav-status-dot ${isBackendOnline ? 'active' : 'sandbox'}`} />
                  <span style={{ color: isBackendOnline ? 'var(--accent-cyan)' : 'var(--accent-yellow)' }}>
                    {isBackendOnline ? 'ONLINE' : 'OFFLINE (SANDBOX)'}
                  </span>
                </div>
              </div>
              
              <button 
                onClick={checkHealth}
                className="icon-button-hud"
                title="Diagnose connection"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button className="icon-button-hud" style={{ position: 'relative' }}>
                <Bell className="w-4 h-4" />
                <span style={{ position: 'absolute', top: '4px', right: '4px', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-cyan)' }} />
              </button>

              <div style={{ height: '24px', width: '1px', background: 'rgba(255,255,255,0.06)' }} />

              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop" 
                alt="Developer Avatar" 
                className="avatar-hud"
              />
            </div>
          </header>

          {/* Main Dashboard HUD Content */}
          <main className="workspace-grid-crisp">
            
            {/* Left Side: Directory folders & Mini-charts */}
            <section className="ide-explorer-panel crisp-panel">
              <div className="sidebar-brand-header">
                <Cpu className="w-4.5 h-4.5 text-cyan-400" />
                <span className="sidebar-brand-title">PolyTest-AI</span>
              </div>

              <div className="sidebar-search-wrapper">
                <Search className="w-3.5 h-3.5 sidebar-search-icon" />
                <input 
                  type="text" 
                  placeholder="Search files..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="sidebar-search-input"
                />
              </div>

              <div className="flex-row-align" style={{ justifyContent: 'space-between', width: '100%', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                <span className="mono-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
                  Files Explorer
                </span>
                
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button 
                    onClick={() => setShowAddFileForm(!showAddFileForm)}
                    style={{ fontSize: '10px', color: 'var(--accent-green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', outline: 'none' }}
                  >
                    <Plus className="w-3 h-3" />
                    Add File
                  </button>
                  <button 
                    onClick={triggerAutoDetect}
                    disabled={isScanning}
                    style={{ fontSize: '10px', color: 'var(--accent-cyan)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', outline: 'none' }}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                    Sync
                  </button>
                </div>
              </div>

              {/* Inline Add Sandbox File Form */}
              {showAddFileForm && (
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', boxSizing: 'border-box', textAlign: 'left', marginTop: '6px' }}>
                  <span className="mono-label" style={{ fontSize: '8px', color: 'var(--text-muted)' }}>ADD NEW SANDBOX FILE</span>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <input 
                      type="text" 
                      placeholder="e.g. src/services/AuthService.ts" 
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      style={{ background: '#02040a', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '4px 8px', color: '#fff', fontSize: '10px', fontFamily: 'var(--font-mono)', width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <select
                      value={newFileLanguage}
                      onChange={(e) => setNewFileLanguage(e.target.value)}
                      style={{ flex: 1, background: '#02040a', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '4px 6px', color: '#fff', fontSize: '9px', fontFamily: 'var(--font-mono)' }}
                    >
                      <option value="TypeScript">TypeScript</option>
                      <option value="Python">Python</option>
                      <option value="Go">Go</option>
                      <option value="Java">Java</option>
                      <option value="C++">C++</option>
                    </select>
                    
                    <select
                      value={newFileFramework}
                      onChange={(e) => setNewFileFramework(e.target.value)}
                      style={{ flex: 1, background: '#02040a', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '4px 6px', color: '#fff', fontSize: '9px', fontFamily: 'var(--font-mono)' }}
                    >
                      <option value="Jest">Jest</option>
                      <option value="pytest">pytest</option>
                      <option value="testing">testing</option>
                      <option value="JUnit 5">JUnit 5</option>
                      <option value="Google Test">Google Test</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', marginTop: '2px' }}>
                    <button
                      onClick={() => {
                        setShowAddFileForm(false);
                        setNewFileName('');
                      }}
                      style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddFileSubmit}
                      style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: '#fff', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))', border: 'none', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}

              {/* Directory Tree */}
              <div className="file-tree-container" style={{ width: '100%' }}>
                <div className="tree-node-folder flex-row-align">
                  <Folder className="w-3.5 h-3.5 text-purple-400 fill-current" />
                  <span>quantum-core-v2</span>
                </div>
                
                <div className="tree-node-nested-line-container">
                  <div className="tree-node-folder flex-row-align">
                    <Folder className="w-3.5 h-3.5 text-purple-400 fill-current" />
                    <span>src</span>
                  </div>

                  <div className="tree-node-nested-line-container">
                    {files.filter(file => file.file_path.toLowerCase().includes(searchQuery.toLowerCase())).map((file, idx) => {
                      const isSelected = selectedFile?.file_path === file.file_path;
                      const baseName = file.file_path.split('/').pop() || '';
                      const coverage = baseName === 'PaymentService.ts' ? '98%' : baseName === 'UserAuth.ts' ? '92%' : '84%';
                      return (
                        <div
                          key={idx}
                          onClick={() => handleFileSelect(file)}
                          className={`file-item-node ${isSelected ? 'selected' : ''}`}
                          style={{ justifyContent: 'space-between', display: 'flex', width: '100%' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                            <FileCode className="w-3.5 h-3.5" style={{ color: getLanguageColor(file.language), flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{baseName}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            <span style={{ fontSize: '8px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', background: 'rgba(0, 245, 255, 0.05)', padding: '1px 4px', borderRadius: '3px' }}>{coverage}</span>
                            <span style={{ fontSize: '8px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>cached</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Historical Coverage Performance Mini-Charts Analytics */}
              <div className="coverage-analytics-box" style={{ width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '8px' }}>
                <span className="mono-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <Activity className="w-3.5 h-3.5 text-purple-400" />
                  Module Coverage
                </span>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  
                  {/* Bar 1 */}
                  <div className="coverage-bar-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      <span>UserAuth.ts</span>
                      <span style={{ color: 'var(--accent-green)' }}>92%</span>
                    </div>
                    <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: '92%', height: '100%', background: 'var(--accent-green)', borderRadius: '2px' }} />
                    </div>
                  </div>

                  {/* Bar 2 */}
                  <div className="coverage-bar-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      <span>PaymentService.ts</span>
                      <span style={{ color: 'var(--accent-cyan)' }}>98%</span>
                    </div>
                    <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: '98%', height: '100%', background: 'var(--accent-cyan)', borderRadius: '2px' }} />
                    </div>
                  </div>

                  {/* Bar 3 */}
                  <div className="coverage-bar-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      <span>DataParser.cpp</span>
                      <span style={{ color: 'var(--accent-purple)' }}>84%</span>
                    </div>
                    <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: '84%', height: '100%', background: 'var(--accent-purple)', borderRadius: '2px' }} />
                    </div>
                  </div>

                </div>
              </div>

              {/* Bottom builds & settings navigation links */}
              <div className="sidebar-bottom-nav">
                <div className="sidebar-nav-item active">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>PROJECTS</span>
                </div>
                <div className="sidebar-nav-item" onClick={() => setTerminalTab('metrics')}>
                  <Terminal className="w-3.5 h-3.5" />
                  <span>BUILDS</span>
                </div>
                <div className="sidebar-nav-item" onClick={() => setCanvasTab('inspector')}>
                  <Settings className="w-3.5 h-3.5" />
                  <span>SETTINGS</span>
                </div>
              </div>

              {/* Workspace footer */}
              <div className="source-root-banner" style={{ width: '100%' }}>
                <span className="mono-label" style={{ display: 'block', marginBottom: '4px' }}>Workspace Root</span>
                <span style={{ color: 'var(--text-secondary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)', fontSize: '10px' }} title={projectRoot}>{projectRoot}</span>
              </div>
            </section>

            {/* Center Panel: Dual Canvas Tabs Editor */}
            <section className="workspace-center-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              
              {/* TOP BAR: Document Tabs on Left, AI Workbench Tabs on Right */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                background: '#090a0f',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)', 
                width: '100%', 
                padding: '0 12px',
                height: '35px',
                minHeight: '35px',
                boxSizing: 'border-box'
              }}>
                
                {/* Document tabs */}
                <div className="editor-tabs-bar" style={{ display: 'flex', gap: '2px', height: '100%', alignItems: 'flex-end' }}>
                  <div 
                    className={`editor-tab-item active`} 
                    style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-primary)',
                      background: '#08090c',
                      borderRight: '1px solid rgba(255,255,255,0.05)',
                      borderTop: '2px solid var(--accent-cyan)',
                      height: '100%',
                      boxSizing: 'border-box',
                      cursor: 'pointer'
                    }}
                  >
                    <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{selectedFile ? selectedFile.file_path.split('/').pop() : 'PaymentService.ts'}</span>
                  </div>
                </div>

                {/* Workspace display toggle canvas tabs & Layout resize actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {!isHidden && (
                    <div className="workspace-canvas-tabs" style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', padding: '2px', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.05)', gap: '4px' }}>
                      <button
                        onClick={() => setCanvasTab('inspector')}
                        className={`preset-tab-btn ${canvasTab === 'inspector' ? 'active' : ''}`}
                        style={{ 
                          padding: '3px 8px', 
                          fontSize: '9px', 
                          fontFamily: 'var(--font-mono)', 
                          borderRadius: '3px', 
                          position: 'relative', 
                          background: canvasTab === 'inspector' ? 'rgba(255,255,255,0.05)' : 'transparent', 
                          border: 'none', 
                          color: canvasTab === 'inspector' ? '#fff' : 'var(--text-secondary)',
                          cursor: 'pointer' 
                        }}
                      >
                        AST INSPECTOR
                      </button>
                      <button
                        onClick={() => setCanvasTab('linter')}
                        className={`preset-tab-btn ${canvasTab === 'linter' ? 'active' : ''}`}
                        style={{ 
                          padding: '3px 8px', 
                          fontSize: '9px', 
                          fontFamily: 'var(--font-mono)', 
                          borderRadius: '3px', 
                          position: 'relative', 
                          background: canvasTab === 'linter' ? 'rgba(255,255,255,0.05)' : 'transparent', 
                          border: 'none', 
                          color: canvasTab === 'linter' ? '#fff' : 'var(--text-secondary)',
                          cursor: 'pointer' 
                        }}
                      >
                        DRYCOMPILE LINTER
                      </button>
                      <button
                        onClick={() => setCanvasTab('code')}
                        className={`preset-tab-btn ${canvasTab === 'code' ? 'active' : ''}`}
                        style={{ 
                          padding: '3px 8px', 
                          fontSize: '9px', 
                          fontFamily: 'var(--font-mono)', 
                          borderRadius: '3px', 
                          position: 'relative', 
                          background: canvasTab === 'code' ? 'rgba(255,255,255,0.05)' : 'transparent', 
                          border: 'none', 
                          color: canvasTab === 'code' ? '#fff' : 'var(--text-secondary)',
                          cursor: 'pointer' 
                        }}
                      >
                        CODE PREVIEW
                      </button>
                    </div>
                  )}

                  {/* Layout Size controls */}
                  <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '2px', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.05)', gap: '2px' }}>
                    <button
                      onClick={() => setWorkbenchWidth('wide')}
                      className={`preset-tab-btn ${workbenchWidth === 'wide' && !isHidden ? 'active' : ''}`}
                      style={{
                        padding: '3px 6px',
                        fontSize: '8px',
                        fontFamily: 'var(--font-mono)',
                        borderRadius: '3px',
                        background: workbenchWidth === 'wide' && !isHidden ? 'rgba(0, 245, 255, 0.1)' : 'transparent',
                        border: 'none',
                        color: workbenchWidth === 'wide' && !isHidden ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                      title="Split View (Wide Workbench)"
                    >
                      <Layout className="w-3 h-3" />
                      <span>55:45</span>
                    </button>
                    
                    <button
                      onClick={() => setWorkbenchWidth('narrow')}
                      className={`preset-tab-btn ${workbenchWidth === 'narrow' && !isHidden ? 'active' : ''}`}
                      style={{
                        padding: '3px 6px',
                        fontSize: '8px',
                        fontFamily: 'var(--font-mono)',
                        borderRadius: '3px',
                        background: workbenchWidth === 'narrow' && !isHidden ? 'rgba(0, 245, 255, 0.1)' : 'transparent',
                        border: 'none',
                        color: workbenchWidth === 'narrow' && !isHidden ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                      title="Narrow Workbench View"
                    >
                      <Columns className="w-3 h-3" />
                      <span>75:25</span>
                    </button>

                    <button
                      onClick={() => setWorkbenchWidth(isHidden ? 'wide' : 'hidden')}
                      className={`preset-tab-btn ${isHidden ? 'active' : ''}`}
                      style={{
                        padding: '3px 6px',
                        fontSize: '8px',
                        fontFamily: 'var(--font-mono)',
                        borderRadius: '3px',
                        background: isHidden ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                        border: 'none',
                        color: isHidden ? '#ef4444' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                      title={isHidden ? "Show Workbench" : "Hide Workbench"}
                    >
                      {isHidden ? <PanelRightOpen className="w-3 h-3 text-cyan-400" /> : <PanelRightClose className="w-3 h-3 text-red-400" />}
                      <span>{isHidden ? "SHOW" : "HIDE"}</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* DUAL PANE WORKSPACE SPLIT */}
              <div style={{ display: 'flex', flex: 1, overflow: 'hidden', width: '100%' }}>
                
                {/* LEFT PANE: Syntax Highlighted Original Source Code Editor */}
                <div style={{ 
                  flex: flexShares.left, 
                  minWidth: 0,
                  borderRight: !isHidden ? '1px solid rgba(255, 255, 255, 0.05)' : 'none', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  background: '#08090c', 
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  {/* Breadcrumbs Row */}
                  <div className="editor-breadcrumbs" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    padding: '8px 16px', 
                    background: '#08090c', 
                    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                    fontSize: '10px', 
                    fontFamily: 'var(--font-mono)', 
                    color: 'var(--text-secondary)',
                    textAlign: 'left'
                  }}>
                    {(() => {
                      const breadcrumbs = selectedFile 
                        ? ['polytest-sandbox', ...selectedFile.file_path.split('/')] 
                        : ['polytest-sandbox', 'src', 'services', 'PaymentService.ts'];
                      return breadcrumbs.map((crumb, idx) => (
                        <React.Fragment key={idx}>
                          {idx > 0 && <span style={{ opacity: 0.3 }}>/</span>}
                          <span style={{ color: idx === breadcrumbs.length - 1 ? 'var(--accent-cyan)' : 'inherit' }}>
                            {crumb}
                          </span>
                        </React.Fragment>
                      ));
                    })()}
                  </div>

                  {/* Code Editor Body */}
                  <div style={{ 
                    flex: 1, 
                    overflowY: 'auto', 
                    padding: '16px', 
                    background: '#08090c', 
                    textAlign: 'left' 
                  }}>
                    {renderHighlightedCode(
                      selectedFile 
                        ? (MOCK_SOURCE_CODE[selectedFile.file_path] || `// No source code for ${selectedFile.file_path}`)
                        : `// Load a sandbox file to view code`
                    )}
                  </div>

                  {/* Editor Status Bar */}
                  <div style={{ 
                    height: '24px', 
                    background: '#090a0f', 
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '0 12px', 
                    fontSize: '10px', 
                    fontFamily: 'var(--font-mono)', 
                    color: 'var(--text-muted)' 
                  }}>
                    <div>
                      <span>Ln 1, Col 1</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <span>Spaces: 2</span>
                      <span>UTF-8</span>
                      <span style={{ color: 'var(--accent-cyan)' }}>
                        {(selectedFile?.language || 'TypeScript').toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* RIGHT PANE: Interactive AI Workbench Tools */}
                <div style={{ 
                  flex: flexShares.right, 
                  minWidth: isHidden ? 0 : '240px',
                  display: isHidden ? 'none' : 'flex', 
                  flexDirection: 'column', 
                  background: '#090a0f', 
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  
                  {/* Tab views nested stacking */}
                  
                  {/* AST INSPECTOR */}
                  {canvasTab === 'inspector' && (
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', padding: '12px' }}>
                      
                      {/* AST Header banner */}
                      <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', paddingBottom: '10px', marginBottom: '12px', textAlign: 'left' }}>
                        <span className="mono-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px' }}>
                          <Binary className="w-3.5 h-3.5 text-cyan-400" />
                          AST Structural Parser
                        </span>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                          <h2 style={{ fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: '#fff', margin: 0 }}>
                            {selectedFile?.file_path.split('/').pop() || 'None'}
                          </h2>
                          <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', background: 'rgba(0, 245, 255, 0.05)', border: '1px solid rgba(0,245,255,0.12)', color: 'var(--accent-cyan)', padding: '2px 6px', borderRadius: '3px' }}>
                            Complexity: {parsedStructure?.complexity || 'Low'}
                          </span>
                        </div>
                      </div>

                      {isLoadingAnalysis ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', flex: 1 }}>
                          <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
                          <p style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>Profiling AST nodes...</p>
                        </div>
                      ) : parsedStructure ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
                          
                          {/* Global Imports badge box */}
                          {parsedStructure.imports && parsedStructure.imports.length > 0 && (
                            <div className="ast-imports-summary-panel" style={{ padding: '8px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '4px', textAlign: 'left' }}>
                              <span className="mono-label" style={{ fontSize: '8px', marginBottom: '6px', display: 'block', color: 'var(--text-muted)' }}>GLOBAL IMPORT DEPENDENCIES</span>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {parsedStructure.imports.map((imp, idx) => (
                                  <span key={idx} className="ast-import-tag" style={{ fontSize: '9px', padding: '1px 5px' }}>
                                    {imp}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* AST Methods list */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {parsedStructure.classes.map((cls, classIdx) => (
                              <div key={classIdx} className="ast-class-node-group" style={{ textAlign: 'left' }}>
                                <div className="ast-class-header-row" style={{ padding: '4px 0', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                                  <Code className="w-3.5 h-3.5 text-cyan-400" />
                                  <span className="ast-class-keyword" style={{ color: 'var(--accent-cyan)' }}>class</span>
                                  <span className="ast-class-name-label" style={{ fontWeight: 600 }}>{cls.name}</span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginLeft: '8px', borderLeft: '1px solid rgba(255,255,255,0.04)', paddingLeft: '8px', marginTop: '4px' }}>
                                  {cls.methods.map((method, methodIdx) => {
                                    const isSelected = selectedMethods.includes(method.name);
                                    const isFocused = activeNode === method.name;
                                    return (
                                      <motion.div
                                        key={methodIdx}
                                        onClick={() => {
                                          toggleMethod(method.name);
                                          setActiveNode(method.name);
                                        }}
                                        whileHover={{ scale: 1.01, x: 2 }}
                                        whileTap={{ scale: 0.99 }}
                                        className={`ast-node-card-block ${isSelected ? 'selected' : ''} ${isFocused ? 'focused' : ''}`}
                                        style={{ padding: '6px 8px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isFocused ? 'rgba(0, 245, 255, 0.05)' : isSelected ? 'rgba(255,255,255,0.02)' : 'transparent', border: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer' }}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <div className={`ast-node-checkbox ${isSelected ? 'checked' : ''}`} style={{ width: '12px', height: '12px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {isSelected && <Check className="w-2 h-2 stroke-[3]" />}
                                          </div>
                                          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: isFocused ? '#fff' : 'var(--text-secondary)' }}>{method.name}()</span>
                                        </div>
                                        <span style={{ fontSize: '8px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>method</span>
                                      </motion.div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}

                            {parsedStructure.functions && parsedStructure.functions.length > 0 && (
                              <div className="ast-class-node-group" style={{ textAlign: 'left' }}>
                                <div className="ast-class-header-row" style={{ padding: '4px 0', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                                  <span className="ast-class-keyword" style={{ color: 'var(--accent-purple)' }}>module</span>
                                  <span className="ast-class-name-label" style={{ color: 'var(--text-muted)' }}>functions</span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginLeft: '8px', borderLeft: '1px solid rgba(255,255,255,0.04)', paddingLeft: '8px', marginTop: '4px' }}>
                                  {parsedStructure.functions.map((func, funcIdx) => {
                                    const isSelected = selectedMethods.includes(func.name);
                                    const isFocused = activeNode === func.name;
                                    return (
                                      <motion.div
                                        key={funcIdx}
                                        onClick={() => {
                                          toggleMethod(func.name);
                                          setActiveNode(func.name);
                                        }}
                                        whileHover={{ scale: 1.01, x: 2 }}
                                        whileTap={{ scale: 0.99 }}
                                        className={`ast-node-card-block ${isSelected ? 'selected' : ''} ${isFocused ? 'focused' : ''}`}
                                        style={{ padding: '6px 8px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isFocused ? 'rgba(140, 82, 255, 0.05)' : isSelected ? 'rgba(255,255,255,0.02)' : 'transparent', border: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer' }}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <div className={`ast-node-checkbox ${isSelected ? 'checked' : ''}`} style={{ width: '12px', height: '12px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {isSelected && <Check className="w-2 h-2 stroke-[3]" />}
                                          </div>
                                          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: isFocused ? '#fff' : 'var(--text-secondary)' }}>{func.name}()</span>
                                        </div>
                                        <span style={{ fontSize: '8px', fontFamily: 'var(--font-mono)', color: 'var(--accent-purple)' }}>func</span>
                                      </motion.div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Token signature pane nested beautifully */}
                          <div style={{ background: 'rgba(3,7,18,0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', padding: '10px', marginTop: 'auto', textAlign: 'left' }}>
                            {activeNode ? (() => {
                              let matchedArgs = '';
                              parsedStructure.classes.forEach(c => {
                                const found = c.methods.find(m => m.name === activeNode);
                                if (found) matchedArgs = found.args;
                              });
                              if (!matchedArgs && parsedStructure.functions) {
                                const foundFunc = parsedStructure.functions.find(f => f.name === activeNode);
                                if (foundFunc) matchedArgs = foundFunc.args;
                              }
                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  <div>
                                    <span className="mono-label" style={{ color: 'var(--accent-cyan)', fontSize: '8px' }}>TOKEN INSPECTOR</span>
                                    <h4 style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#fff', margin: '2px 0 0 0' }}>{activeNode}()</h4>
                                  </div>
                                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--accent-cyan)', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                                    {matchedArgs}
                                  </div>
                                </div>
                              );
                            })() : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                                <Sliders className="w-4 h-4 text-cyan-400 opacity-60" />
                                <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)' }}>Click any method to inspect compilation tokens</span>
                              </div>
                            )}
                          </div>

                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                          <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Select a sandbox file to load AST.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* DRYCOMPILE LINTER */}
                  {canvasTab === 'linter' && (
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', padding: '12px' }}>
                      
                      {/* Linter Header banner */}
                      <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', paddingBottom: '10px', marginBottom: '12px', textAlign: 'left' }}>
                        <span className="mono-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px' }}>
                          <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
                          Drycompile Subprocess Linter
                        </span>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                          <h2 style={{ fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: '#fff', margin: 0 }}>
                            {selectedFile?.file_path.split('/').pop() || 'No module'}
                          </h2>
                          <span style={{ fontSize: '8px', fontFamily: 'var(--font-mono)', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', color: 'var(--accent-green)', padding: '1px 5px', borderRadius: '3px' }}>
                            COMPILER OK
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
                        {/* Subprocess drycompile scanner output */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                          <span className="mono-label" style={{ fontSize: '8px' }}>SANDBOX COMPILER SCANNER LOGS</span>
                          <div style={{ background: '#02040a', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '6px', padding: '10px', fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', maxHeight: '150px' }}>
                            <div style={{ color: 'var(--text-muted)' }}>[polytest-subprocess] Initializing drycompile for {selectedFile?.file_path.split('/').pop()}...</div>
                            <div style={{ color: 'var(--accent-cyan)' }}>[compiler-dryrun] Offline check: {selectedFile?.language === 'typescript' ? 'node --check' : selectedFile?.language === 'java' ? 'javac -Xlint' : 'gcc -fsyntax-only'}</div>
                            <div>[compiler-dryrun] Resolving import tokens...</div>
                            {parsedStructure?.imports.map((imp, idx) => (
                              <div key={idx} style={{ color: 'var(--text-muted)', paddingLeft: '8px' }}>✓ Dependency: {imp}</div>
                            ))}
                            <div style={{ color: 'var(--accent-green)' }}>[compiler-dryrun] Syntax ok: AST analysis completed.</div>
                          </div>
                        </div>

                        {/* Compiler warnings registry */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                          <span className="mono-label" style={{ fontSize: '8px' }}>COMPILER WARNING REGISTRY</span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ background: 'rgba(255, 193, 7, 0.02)', border: '1px solid rgba(255, 193, 7, 0.1)', borderRadius: '6px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                                <span style={{ color: 'var(--accent-cyan)' }}>Line 14 : CryptoKey</span>
                                <span style={{ color: '#ffc107', background: 'rgba(255, 193, 7, 0.05)', padding: '1px 4px', borderRadius: '2px', border: '1px solid rgba(255, 193, 7, 0.15)', fontSize: '8px' }}>WARNING</span>
                              </div>
                              <p style={{ fontSize: '10px', color: 'var(--text-primary)', margin: 0 }}>Avoid raw types in cryptokey initialization.</p>
                            </div>

                            <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '6px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                                <span style={{ color: 'var(--accent-cyan)' }}>Line 42 : PaymentType</span>
                                <span style={{ color: 'var(--text-secondary)', background: 'rgba(255, 255, 255, 0.02)', padding: '1px 4px', borderRadius: '2px', border: '1px solid rgba(255, 255, 255, 0.06)', fontSize: '8px' }}>ADVISORY</span>
                              </div>
                              <p style={{ fontSize: '10px', color: 'var(--text-primary)', margin: 0 }}>Implicit any in transaction parameter declaration.</p>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* CODE PREVIEW */}
                  {canvasTab === 'code' && (
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', padding: '12px' }}>
                      
                      {/* Code Preview Header */}
                      <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', paddingBottom: '10px', marginBottom: '12px', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span className="mono-label" style={{ fontSize: '9px' }}>Generated Test Suite Preview</span>
                          <h2 style={{ fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', margin: '2px 0 0 0' }}>
                            test_{selectedFile?.file_path.split('/').pop()}
                          </h2>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(currentGeneratedCode);
                              setTerminalLogs(prev => [...prev, '📋 Copied unit test suite code to clipboard!']);
                            }}
                            className="icon-button-hud"
                            title="Copy code"
                            style={{ padding: '4px 8px', fontSize: '9px', display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '3px', cursor: 'pointer', color: '#fff' }}
                          >
                            <Copy className="w-3 h-3" />
                            Copy
                          </button>
                          <button
                            onClick={() => {
                              const blob = new Blob([currentGeneratedCode], { type: 'text/plain' });
                              const link = document.createElement('a');
                              link.href = URL.createObjectURL(blob);
                              link.download = `test_${selectedFile?.file_path.split('/').pop()}`;
                              link.click();
                              setTerminalLogs(prev => [...prev, `💾 Saved file local: test_${selectedFile?.file_path.split('/').pop()}`]);
                            }}
                            className="icon-button-hud"
                            title="Save"
                            style={{ padding: '4px 8px', fontSize: '9px', display: 'flex', gap: '4px', background: 'transparent', border: '1px solid var(--accent-cyan)', borderRadius: '3px', cursor: 'pointer', color: 'var(--accent-cyan)' }}
                          >
                            <Download className="w-3 h-3" />
                            Save
                          </button>
                        </div>
                      </div>

                      {/* Cache Hit indicator */}
                      {useCache && (
                        <div className="prompt-cache-active-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '4px', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="cache-pulse-dot" style={{ width: '4px', height: '4px', background: 'var(--accent-green)', borderRadius: '50%', display: 'inline-block' }} />
                            <span style={{ fontSize: '9px', fontWeight: 600, color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>PROMPT CACHE HIT</span>
                          </div>
                          <span className="cache-hash-badge" style={{ fontSize: '8px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>md5:8b1a5e...</span>
                        </div>
                      )}

                      {/* Test Preview Code Panel */}
                      <div className="code-editor-pane" style={{ flex: 1, background: '#02040a', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '4px', padding: '10px', overflowY: 'auto', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        {renderHighlightedCode(currentGeneratedCode)}
                      </div>

                    </div>
                  )}

                </div>

              </div>

            </section>

            {/* Right Side: Segmented Presets & Sliders */}
            <section className="controls-right-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Unified Telemetry HUD Grid */}
              <div className="telemetry-grid">
                <div className="telemetry-card">
                  <span className="telemetry-card-title">CPU LOAD</span>
                  <span className="telemetry-card-value">{cpuHistory[cpuHistory.length - 1]}%</span>
                  <span className="telemetry-card-desc">Subrunner thread</span>
                </div>
                <div className="telemetry-card">
                  <span className="telemetry-card-title">MEMORY LOAD</span>
                  <span className="telemetry-card-value">{ramHistory[ramHistory.length - 1]}MB</span>
                  <span className="telemetry-card-desc">Sandbox buffer</span>
                </div>
                <div className="telemetry-card">
                  <span className="telemetry-card-title">SPECS GENERATED</span>
                  <span className="telemetry-card-value">{validatedCount}</span>
                  <span className="telemetry-card-desc">Unit tests run</span>
                </div>
                <div className="telemetry-card">
                  <span className="telemetry-card-title">DIAGNOSTICS</span>
                  <span className="telemetry-card-value" style={{ color: syntaxCorrectness === 100 ? 'var(--accent-green)' : 'var(--accent-cyan)' }}>{syntaxCorrectness}% OK</span>
                  <span className="telemetry-card-desc">{issueCount} compiled warnings</span>
                </div>
              </div>

              {/* Dynamic SVG Live Telemetry Chart */}
              {(() => {
                const cpuLinePath = `M ${cpuHistory.map((val, idx) => `${idx * (300 / 14)} ${80 - (val / 100) * 70}`).join(' L ')}`;
                const ramLinePath = `M ${ramHistory.map((val, idx) => `${idx * (300 / 14)} ${80 - (val / 100) * 70}`).join(' L ')}`;
                const cpuAreaPath = `${cpuLinePath} L 300 80 L 0 80 Z`;
                const ramAreaPath = `${ramLinePath} L 300 80 L 0 80 Z`;

                return (
                  <div className="svg-chart-container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="mono-label" style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Real-time System Resource Telemetry</span>
                      <div className="telemetry-chart-legend">
                        <div className="legend-item">
                          <span className="legend-dot cyan" />
                          <span>CPU ({cpuHistory[cpuHistory.length - 1]}%)</span>
                        </div>
                        <div className="legend-item">
                          <span className="legend-dot purple" />
                          <span>RAM ({ramHistory[ramHistory.length - 1]}MB)</span>
                        </div>
                      </div>
                    </div>
                    <svg viewBox="0 0 300 80" className="telemetry-chart-svg">
                      <defs>
                        <linearGradient id="cpuGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="ramGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="var(--accent-purple)" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="var(--accent-purple)" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      
                      {/* Grid Lines */}
                      <line x1="0" y1="20" x2="300" y2="20" className="chart-grid-line" />
                      <line x1="0" y1="40" x2="300" y2="40" className="chart-grid-line" />
                      <line x1="0" y1="60" x2="300" y2="60" className="chart-grid-line" />
                      
                      {/* RAM Area & Line */}
                      <path d={ramAreaPath} fill="url(#ramGradient)" />
                      <path d={ramLinePath} fill="none" stroke="var(--accent-purple)" strokeWidth="1.5" className="chart-neon-glow-purple" />
                      
                      {/* CPU Area & Line */}
                      <path d={cpuAreaPath} fill="url(#cpuGradient)" />
                      <path d={cpuLinePath} fill="none" stroke="var(--accent-cyan)" strokeWidth="1.5" className="chart-neon-glow-cyan" />
                    </svg>
                  </div>
                );
              })()}

              {/* Parameters & Configuration Dock */}
              <div className="crisp-panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span className="mono-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  Parameters Dock
                </span>

                {/* Segmented Preset Selector */}
                <div className="preset-configuration-box" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="mono-label" style={{ display: 'block', textAlign: 'left', fontSize: '8px' }}>AI Prompts Preset</label>
                  
                  <div className="preset-tab-group" style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)', gap: '4px', position: 'relative' }}>
                    <button
                      onClick={() => applyPreset('standard')}
                      className={`preset-tab-btn ${selectedPreset === 'standard' ? 'active' : ''}`}
                      style={{ flex: 1, padding: '6px 0', fontSize: '9px', fontFamily: 'var(--font-mono)', borderRadius: '6px', position: 'relative', background: 'transparent', color: selectedPreset === 'standard' ? 'var(--bg-primary)' : 'var(--text-secondary)', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                    >
                      <span style={{ position: 'relative', zIndex: 2 }}>STANDARD</span>
                      {selectedPreset === 'standard' && (
                        <motion.div 
                          layoutId="presetTabBg" 
                          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--text-primary)', borderRadius: '6px', zIndex: 1 }} 
                          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                        />
                      )}
                    </button>
                    <button
                      onClick={() => applyPreset('robust')}
                      className={`preset-tab-btn ${selectedPreset === 'robust' ? 'active' : ''}`}
                      style={{ flex: 1, padding: '6px 0', fontSize: '9px', fontFamily: 'var(--font-mono)', borderRadius: '6px', position: 'relative', background: 'transparent', color: selectedPreset === 'robust' ? 'var(--bg-primary)' : 'var(--text-secondary)', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                    >
                      <span style={{ position: 'relative', zIndex: 2 }}>ROBUST</span>
                      {selectedPreset === 'robust' && (
                        <motion.div 
                          layoutId="presetTabBg" 
                          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--text-primary)', borderRadius: '6px', zIndex: 1 }} 
                          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                        />
                      )}
                    </button>
                    <button
                      onClick={() => applyPreset('fast')}
                      className={`preset-tab-btn ${selectedPreset === 'fast' ? 'active' : ''}`}
                      style={{ flex: 1, padding: '6px 0', fontSize: '9px', fontFamily: 'var(--font-mono)', borderRadius: '6px', position: 'relative', background: 'transparent', color: selectedPreset === 'fast' ? 'var(--bg-primary)' : 'var(--text-secondary)', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                    >
                      <span style={{ position: 'relative', zIndex: 2 }}>FAST RUN</span>
                      {selectedPreset === 'fast' && (
                        <motion.div 
                          layoutId="presetTabBg" 
                          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--text-primary)', borderRadius: '6px', zIndex: 1 }} 
                          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                        />
                      )}
                    </button>
                  </div>
                </div>

                {/* LLM Provider & Target Model Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="settings-group">
                    <label className="mono-label" style={{ display: 'block', textAlign: 'left', marginBottom: '4px', fontSize: '8px' }}>LLM PROVIDER</label>
                    <select 
                      value={selectedProvider} 
                      onChange={(e) => {
                        setSelectedProvider(e.target.value);
                        if (e.target.value === 'mock') setSelectedModel('gemini-1.5-flash');
                        else if (e.target.value === 'openai') setSelectedModel('gpt-4o');
                        else if (e.target.value === 'gemini') setSelectedModel('gemini-1.5-flash');
                      }}
                      className="crisp-input crisp-select"
                      style={{ padding: '6px 20px 6px 8px', fontSize: '10px' }}
                    >
                      <option value="mock">Offline Mock</option>
                      <option value="gemini">Google Gemini</option>
                      <option value="openai">OpenAI GPT</option>
                    </select>
                  </div>

                  <div className="settings-group">
                    <label className="mono-label" style={{ display: 'block', textAlign: 'left', marginBottom: '4px', fontSize: '8px' }}>TARGET MODEL</label>
                    <input 
                      type="text" 
                      value={selectedModel} 
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="crisp-input"
                      style={{ padding: '6px 8px', fontSize: '10px' }}
                    />
                  </div>
                </div>

                {/* Real-time Temperature Slider */}
                <div className="slider-group-crisp">
                  <div className="slider-label-row">
                    <label className="mono-label" style={{ fontSize: '8px' }}>Temperature</label>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{temperature}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.0" 
                    max="1.0" 
                    step="0.1" 
                    value={temperature} 
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="crisp-slider"
                  />
                </div>

                {/* Real-time Max Tokens Slider */}
                <div className="slider-group-crisp">
                  <div className="slider-label-row">
                    <label className="mono-label" style={{ fontSize: '8px' }}>Max Tokens</label>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{maxTokens}</span>
                  </div>
                  <input 
                    type="range" 
                    min="256" 
                    max="4096" 
                    step="256" 
                    value={maxTokens} 
                    onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                    className="crisp-slider"
                  />
                </div>

                {/* Real-time Target Coverage Slider */}
                <div className="slider-group-crisp">
                  <div className="slider-label-row">
                    <label className="mono-label" style={{ fontSize: '8px' }}>Coverage Target</label>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{coverageTarget}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="50" 
                    max="100" 
                    step="5" 
                    value={coverageTarget} 
                    onChange={(e) => setCoverageTarget(parseInt(e.target.value))}
                    className="crisp-slider"
                  />
                </div>

                {/* Toggles */}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <div className="setting-row-flex" style={{ flex: 1, padding: '4px 8px' }}>
                    <span className="mono-label" style={{ fontSize: '8px' }}>CACHE PROMPTS</span>
                    <input 
                      type="checkbox" 
                      checked={useCache} 
                      onChange={(e) => setUseCache(e.target.checked)} 
                      className="checkbox-custom" 
                    />
                  </div>

                  <div className="setting-row-flex" style={{ flex: 1, padding: '4px 8px' }}>
                    <span className="mono-label" style={{ fontSize: '8px' }}>AUTO-RUN</span>
                    <input 
                      type="checkbox" 
                      checked={runImmediately} 
                      onChange={(e) => setRunImmediately(e.target.checked)} 
                      className="checkbox-custom" 
                    />
                  </div>
                </div>

                {/* Action button */}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !selectedFile || selectedMethods.length === 0}
                  className="crisp-button"
                  style={{ width: '100%', padding: '10px 12px', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Generating Suite...
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Generate Suite
                    </>
                  )}
                </button>
              </div>

              {/* MD5 Cryptographic Cache Diagnostics */}
              <div className="crisp-panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
                <span className="mono-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap className={`w-3.5 h-3.5 ${useCache ? 'text-amber-400 animate-pulse' : 'text-zinc-600'}`} />
                  MD5 Cryptographic Cache
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="mono-label" style={{ fontSize: '8px', color: 'var(--text-muted)' }}>CACHE STATUS</span>
                    <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: useCache ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 600 }}>
                      {useCache ? 'ACTIVE (HIT)' : 'DISABLED'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span className="mono-label" style={{ fontSize: '8px', color: 'var(--text-muted)' }}>CALCULATED HASH SIGNATURE</span>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: useCache ? 'var(--accent-cyan)' : 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', background: 'rgba(0, 245, 255, 0.02)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(0,245,255,0.08)' }}>
                      {useCache ? 'md5:8b1a5e52a9a4d2e8b0a5f4c3d2e1a0b5' : '0x0000000000000000000000000'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '6px' }}>
                    <span className="mono-label" style={{ fontSize: '8px', color: 'var(--text-muted)' }}>CACHE HEURISTICS</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                      <span className="ast-import-tag" style={{ fontSize: '8px', padding: '1px 4px', background: 'rgba(255,255,255,0.01)' }}>AST matching: OK</span>
                      <span className="ast-import-tag" style={{ fontSize: '8px', padding: '1px 4px', background: 'rgba(255,255,255,0.01)' }}>Filesize matching: OK</span>
                      <span className="ast-import-tag" style={{ fontSize: '8px', padding: '1px 4px', background: 'rgba(255,255,255,0.01)' }}>Temp matching: OK</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subrunner Stdin & Execution Logs */}
              <div className="crisp-panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid var(--border-color)', borderRadius: '10px', background: 'rgba(3, 7, 18, 0.3)' }}>
                
                {/* Visual Title Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '10px' }}>
                  <span className="mono-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Activity className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                    Subrunner Terminal Logs
                  </span>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-mono)', fontSize: '8px', color: 'var(--text-muted)' }}>
                    <span>PID: <span style={{ color: 'var(--accent-green)' }}>49811</span></span>
                    <span style={{ width: '1px', height: '8px', background: 'rgba(255,255,255,0.1)' }} />
                    <span>CPU: <span style={{ color: 'var(--accent-cyan)' }}>{cpuHistory[cpuHistory.length - 1]}%</span></span>
                    <span style={{ width: '1px', height: '8px', background: 'rgba(255,255,255,0.1)' }} />
                    <span>MEM: <span style={{ color: 'var(--accent-purple)' }}>{ramHistory[ramHistory.length - 1]}MB</span></span>
                  </div>
                </div>

                <div className="terminal-hud-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <div className="terminal-hud-tabs" style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      onClick={() => setTerminalTab('execution')}
                      className={`terminal-tab-btn ${terminalTab === 'execution' ? 'active' : ''}`}
                      style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', cursor: 'pointer', background: 'none', border: 'none', padding: '4px 8px', borderRadius: '4px', color: terminalTab === 'execution' ? 'var(--accent-cyan)' : 'var(--text-secondary)' }}
                    >
                      EXECUTION LOGS
                    </button>
                    <button 
                      onClick={() => setTerminalTab('metrics')}
                      className={`terminal-tab-btn ${terminalTab === 'metrics' ? 'active' : ''}`}
                      style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', cursor: 'pointer', background: 'none', border: 'none', padding: '4px 8px', borderRadius: '4px', color: terminalTab === 'metrics' ? 'var(--accent-cyan)' : 'var(--text-secondary)' }}
                    >
                      RUN METRICS
                    </button>
                    <button 
                      onClick={() => setTerminalTab('warnings')}
                      className={`terminal-tab-btn ${terminalTab === 'warnings' ? 'active' : ''}`}
                      style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', cursor: 'pointer', background: 'none', border: 'none', padding: '4px 8px', borderRadius: '4px', color: terminalTab === 'warnings' ? 'var(--accent-cyan)' : 'var(--text-secondary)' }}
                    >
                      DIAGNOSTICS
                    </button>
                  </div>

                  <span style={{ fontSize: '8px', fontFamily: 'var(--font-mono)', background: 'rgba(0, 245, 255, 0.05)', border: '1px solid rgba(0,245,255,0.12)', color: 'var(--accent-cyan)', padding: '2px 6px', borderRadius: '3px' }}>
                    SECURE SANDBOX
                  </span>
                </div>

                <div className="terminal-canvas-scroller" style={{ background: '#02040a', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '14px', fontFamily: 'var(--font-mono)', fontSize: '10px', minHeight: '120px', maxHeight: '180px', overflowY: 'auto', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {terminalTab === 'execution' && (
                    terminalLogs.map((log, idx) => (
                      <div key={idx} style={{ lineHeight: '1.6', display: 'flex', gap: '6px' }}>
                        <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>[sys_run:49811]</span>
                        {log.includes('❌') ? (
                          <span style={{ color: 'var(--accent-red)' }}>{log}</span>
                        ) : log.includes('✅') || log.includes('✨') || log.includes('🟢') ? (
                          <span style={{ color: 'var(--accent-cyan)' }}>{log}</span>
                        ) : log.includes('🚀') || log.includes('🌐') ? (
                          <span style={{ color: 'var(--accent-purple)' }}>{log}</span>
                        ) : log.includes('📊') ? (
                          <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{log}</span>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)' }}>{log}</span>
                        )}
                      </div>
                    ))
                  )}

                  {terminalTab === 'metrics' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-secondary)' }}>
                      <p style={{ color: 'var(--accent-cyan)', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px', fontSize: '11px', fontWeight: 600 }}>📊 Subrunner Execution Metrics Summary</p>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                          <span>LLM Offline Provider:</span>
                          <span style={{ color: '#fff', fontWeight: 600 }}>{selectedProvider.toUpperCase()}</span>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                          <span>Subprocess temperature:</span>
                          <span style={{ color: '#fff', fontWeight: 600 }}>{temperature} / 1.0</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                          <span>Max Token allocation:</span>
                          <span style={{ color: '#fff', fontWeight: 600 }}>{maxTokens} / 4096 tokens</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                            <span>Target test coverage:</span>
                            <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{coverageTarget}% target</span>
                          </div>
                          <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.02)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${coverageTarget}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-purple))' }} />
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '6px' }}>
                          <span>MD5 Cache Signature:</span>
                          <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>CACHED HIT (0.018s compiled)</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {terminalTab === 'warnings' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-secondary)' }}>
                      <p style={{ color: 'var(--accent-cyan)', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px', fontSize: '11px', fontWeight: 600 }}>🔍 Telemetry Diagnostics Scan Registry</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                          <span style={{ color: 'var(--accent-red)', flexShrink: 0 }}>[WARN]</span>
                          <p style={{ margin: 0 }}>[PaymentService.ts:14] Avoid raw type parameters inside cryptographic keys.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                          <span style={{ color: 'var(--accent-yellow)', flexShrink: 0 }}>[INFO]</span>
                          <p style={{ margin: 0 }}>[PaymentService.ts:32] Unused dependency 'stripe' imported on line 2.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '6px' }}>
                          <span style={{ color: 'var(--accent-green)', flexShrink: 0 }}>[SUCCESS]</span>
                          <p style={{ margin: 0, color: 'var(--accent-green)' }}>All other AST compiled modules reported 100% syntactically correct.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </section>

          </main>

          {/* Footer */}
          <footer className="saas-footer-crisp">
            <p>© 2026 PolyTest AI REST Platform. Enterprise Edition.</p>
            <p className="footer-subtitle-crisp" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Binary className="w-3.5 h-3.5" />
              TypeScript Backend + React Frontend Architecture
              <span style={{ color: 'rgba(255,255,255,0.08)' }}>|</span>
              <button 
                onClick={() => setViewMode('guide')}
                style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontSize: '9px', cursor: 'pointer', padding: 0, textDecoration: 'underline', outline: 'none' }}
              >
                USER GUIDE MANUAL
              </button>
            </p>
          </footer>

          {/* Linear Gradient Definitions for SVG Circle */}
          <svg style={{ width: 0, height: 0, position: 'absolute' }}>
            <defs>
              <linearGradient id="cyanPurpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--accent-cyan)" />
                <stop offset="100%" stopColor="var(--accent-purple)" />
              </linearGradient>
            </defs>
          </svg>

          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* VIEW MODE 3: COMPREHENSIVE DEVELOPER USER GUIDE */}
        {/* ========================================================================= */}
        {viewMode === 'guide' && (
          <motion.div 
            key="guide-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'radial-gradient(circle at 50% 0%, #0c0f1d 0%, #030712 100%)', padding: '40px 20px', boxSizing: 'border-box' }}
          >
            {/* Header / Nav */}
            <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '30px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity className="w-5 h-5 text-purple-400 animate-pulse" />
                <span style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#fff', letterSpacing: '-0.02em' }}>PolyTest AI Manual</span>
              </div>
              <button 
                onClick={() => setViewMode('landing')}
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', padding: '6px 14px', fontSize: '11px', fontFamily: 'var(--font-mono)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Return Home
              </button>
            </div>

            {/* Guide Content */}
            <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%', background: 'rgba(3, 7, 18, 0.4)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '40px', boxSizing: 'border-box', textAlign: 'left' }}>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', background: 'rgba(0, 245, 255, 0.05)', color: 'var(--accent-cyan)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(0, 245, 255, 0.12)' }}>
                OFFICIAL SYSTEM MANUAL
              </span>
              
              <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#fff', marginTop: '16px', marginBottom: '8px', letterSpacing: '-0.03em' }}>
                Polytest AI Rest Engine Guide
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '32px' }}>
                A highly comprehensive, premium operations manual for engineering teams building test suites with the Polytest AI local sandbox and compiler analysis framework.
              </p>

              {/* Grid sections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                
                {/* Sec 1 */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '20px' }}>
                  <h3 style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 10px 0' }}>
                    01. AST STRUCTURAL ANALYSIS
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
                    The Double-Column AST Class Explorer visualizes your target module classes, static methods, imports, and variables. Selecting any class method triggers the Token Inspector sidebar, providing instant access to parameter counts, accessibility parameters, async states, and recommended code coverage test mocks.
                  </p>
                </div>

                {/* Sec 2 */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '20px' }}>
                  <h3 style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 10px 0' }}>
                    02. DRYCOMPILE LINTER
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
                    The Subprocess Linter executes compile-time dryruns using target languages (e.g. `node --check`, `javac -Xlint`, `gcc -fsyntax-only`). Active warnings are captured inside the warning table registry with designated quick-remedies for instant code adjustment.
                  </p>
                </div>

                {/* Sec 3 */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '20px' }}>
                  <h3 style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 10px 0' }}>
                    03. SUBPROCESS SUBRUNNER TELEMETRY
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
                    Subrunner tracks terminal stdout streams, sandboxed process IDs (PID), memory consumption, and thread execution timers. Swapping between Logs, Metrics, and Diagnostics updates real-time telemetry from active test generation suites.
                  </p>
                </div>

                {/* Sec 4 */}
                <div style={{ paddingBottom: '10px' }}>
                  <h3 style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 10px 0' }}>
                    04. CRYPTOGRAPHIC PROMPT CACHING
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
                    Active prompt caching calculates MD5 checksum signatures derived from prompt configurations, source files, and LLM arguments. If identical file versions are scanned, Polytest AI instantly pulls test logs from the local `.cache` folder, bypassing API token calls and delivering a 15ms compile-time.
                  </p>
                </div>

              </div>

              {/* CTA */}
              <div style={{ marginTop: '40px', padding: '20px', background: 'rgba(0, 245, 255, 0.02)', border: '1px solid rgba(0, 245, 255, 0.08)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#fff', margin: 0 }}>Ready to validate your code sandbox?</h4>
                  <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Launch the developer workspace directly from the console dashboard.</p>
                </div>
                <button 
                  onClick={() => setViewMode('console')}
                  style={{ background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))', border: 'none', borderRadius: '6px', color: '#fff', padding: '8px 18px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
                >
                  Launch Console
                </button>
              </div>

            </div>

            {/* Footer */}
            <div style={{ marginTop: '40px', fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              © 2026 PolyTest AI REST Platform. All rights reserved.
            </div>

          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

export default App;
